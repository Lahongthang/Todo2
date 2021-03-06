import { createSelector } from 'reselect'

const initialState = {
    status: 'idle',
    message: 'succeed',
    entities: {
        data: [],
        links: {},
        meta: {
            links: []
        }
    }
}

export default function todosReducer(state = initialState, action) {
    switch (action.type) {
        case 'todos/todoAdded': {
            const todo = action.payload
            return {
                ...state,
                entities: {
                    ...state.entities,
                    data: [
                        todo,
                        ...state.entities.data,
                    ]
                }
            }
        }
        case 'todos/todoToggled': {
            const todoId = action.payload
            return {
                ...state,
                entities: {
                    ...state.entities,
                    data: state.entities.data.map(todo => {
                        if (todo.id !== todoId) {
                            return todo
                        }
                        return {
                            ...todo,
                            completed: !todo.completed
                        }
                    })
                }
            }
        }
        case 'todos/colorSelected': {
            const { color, todoId } = action.payload
            return {
                ...state,
                entities: {
                    ...state.entities,
                    data: state.entities.data.map(todo => {
                        if (todo.id !== todoId) {
                            return todo
                        }
                        return {
                            ...todo,
                            color: {
                                name: color
                            }
                        }
                    })
                }
            }
        }
        case 'todos/todoDeleted': {
            const todoId = action.payload
            return {
                ...state,
                entities: {
                    ...state.entities,
                    data: state.entities.data.filter(todo => todo.id !== todoId)
                }
            }
        }
        case 'todos/allCompleted': {
            return {
                ...state,
                entities: {
                    ...state.entities,
                    data: state.entities.data.map(todo => {
                        return {
                            ...todo,
                            completed: true
                        }
                    })
                }
            }
        }
        case 'todos/completedCleared': {
            return {
                ...state,
                entities: {
                    ...state.entities,
                    data: state.entities.data.filter(todo => !todo.completed)
                }
            }
        }
        case 'todos/todosLoading': {
            return {
                ...state,
                status: 'loading'
            }
        }
        case 'todos/todosLoaded': {
            return {
                ...state,
                status: 'idle',
                entities: action.payload,
                message: 'succeed'
            }
        }
        case 'todos/todosNotFound': {
            return {
                ...state,
                status: 'idle',
                entities: {
                    data: [],
                    links: {},
                    meta: {
                        ...state.entities.meta,
                        links: []
                    }
                },
                message: action.payload
            }
        }
        default:
        return state
    }
}

//action creators
export const todoAdded = (todo) => ({ type: 'todos/todoAdded', payload: todo })

export const todoToggled = (todoId) => ({
    type: 'todos/todoToggled',
    payload: todoId
})

export const todoColorSelected = (todoId, color) => ({
    type: 'todos/colorSelected',
    payload: { todoId, color }
})

export const todoDeleted = (todoId) => ({
    type: 'todos/todoDeleted',
    payload: todoId
})

export const allTodosCompleted = () => ({ type: 'todos/allCompleted' })

export const completedTodosCleared = () => ({ type: 'todos/completedCleared' })

export const todosLoading = () => ({ type: 'todos/todosLoading' })

export const endLoading = () => ({type: 'todos/endLoading'})

export const todosLoaded = (todos) => ({
    type: 'todos/todosLoaded',
    payload: todos
})

export const todosNotFound = (message) => ({type: 'todos/todosNotFound', payload: message})

// Thunk function

// fetch todos with filters
export const fetchTodos = ({status, colors}) => async (dispatch) => {
    dispatch(todosLoading())
    const tempUrl = `http://localhost:8000/api/todos?pageSize=3&sortBy=dateDesc`
    const statusParam = status ? `&status=${status}` : ''
    const colorsParam = colors ? `&colors=${colors}` : ''
    let url = tempUrl + statusParam + colorsParam
    await fetch(url)
        .then(response => response.json())
        .then(result => {
            console.log('result: ', result)
            if (result.message) {
                console.log('NOT FOUND!')
                dispatch(todosNotFound(result.message))
            } else {
                dispatch(todosLoaded(result))
            }
        })
}

// update todo
export const updateTodo = ({id, completed, color}) => async dispatch => {
    let url
    let action

    if (completed !== undefined) {
        url = `http://localhost:8000/api/todos/${id}?completed=${!completed}`
        action = todoToggled(id)
    } else if (color !== undefined) {
        url = `http://localhost:8000/api/todos/${id}?color=${color}`
        action = todoColorSelected(id, color)
    }

    const response = await fetch(url, {method: 'PUT'})
    if (!response.ok) {
        throw new Error('Update todo faild!')
    }
    console.log('Update todo succeed!');
    dispatch(action)
}

//add todo
export const addTodo = text => async dispatch => {
    await fetch(`http://localhost:8000/api/todos?text=${text}`, {method: 'POST'})
        .then(response => response.json())
        .then(todo => dispatch(todoAdded(todo.data)))
}

//delete todo
export const deleteTodo = todoId => async dispatch => {
    const response = await fetch(`http://localhost:8000/api/todos/${todoId}`, {method: 'DELETE'})
    if (!response.ok) {
        throw new Error('Delete todo failed!')
    }
    console.log('Delete todo succeed!');
    dispatch(todoDeleted(todoId))
}

// mark all complete or clear all complete
export const markOrClear = (todoIds, action) => async dispatch => {
    let url
    if (action === 'mark') {
        url = `http://localhost:8000/api/todos/mark-completed?ids=${todoIds}`
        action = allTodosCompleted()
    } else {
        url = `http://localhost:8000/api/todos/clear-completed?ids=${todoIds}`
        action = completedTodosCleared()
    }
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error('failed!')
    }
    dispatch(action)
}

//pagination 
export const pagination = ({link, status, colors}) => async dispatch => {
    dispatch(todosLoading())
    const url = link + `&pageSize=3&sortBy=dateDesc&status=${status}&colors=${colors}`
    await fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                dispatch(todosNotFound(result.message))
            } else {
                dispatch(todosLoaded(result))
            }
        })
}


//selectors
const selectEntities = state => state.todos.entities

export const selectTodos = createSelector(
    selectEntities,
    entities => entities.data.sort((first, second) => {
        if (first.created_at > second.created_at) {
            return -1
        } else {
            return 0
        }
    })
)

export const selectTodoIds = createSelector(
    selectTodos,
    todos => todos.map(todo => todo.id)
)

export const selectTodoById = todoId => createSelector(
    selectTodos,
    todos => todos.find(todo => todo.id === todoId)
)

export const selectTodosCompleted = createSelector(
    selectTodos,
    todos => todos.filter(todo => todo.completed)
)

export const selectTodoCompletedIds = createSelector(
    selectTodosCompleted,
    todoCompleted => todoCompleted.map(todo => todo.id)
)

export const selectLinks = createSelector(
    selectEntities,
    entities => entities.links
)

export const selectMetaLinks = createSelector(
    selectEntities,
    entities => entities.meta.links
)