import { useState, useEffect, useRef } from 'react';
import './App.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos).map((todo: any) => ({
      ...todo,
      createdAt: new Date(todo.createdAt)
    })) : [];
  });
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // 添加新待办事项
  const addTodo = () => {
    if (newTodo.trim() === '') return;
    
    const newTodoItem: Todo = {
      id: Date.now(),
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setTodos([...todos, newTodoItem]);
    setNewTodo('');
  };

  // 删除待办事项
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 切换完成状态
  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // 开始编辑
  const startEdit = (id: number, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingId !== null && editingText.trim() !== '') {
      setTodos(todos.map(todo =>
        todo.id === editingId ? { ...todo, text: editingText.trim() } : todo
      ));
      setEditingId(null);
      setEditingText('');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  // 清空所有已完成
  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  // 过滤待办事项
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // 统计信息
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const activeTodos = totalTodos - completedTodos;

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingId !== null) {
        saveEdit();
      } else {
        addTodo();
      }
    } else if (e.key === 'Escape' && editingId !== null) {
      cancelEdit();
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">📝 Todo List</h1>
          <p className="subtitle">Stay organized and productive</p>
        </header>

        <div className="stats-card">
          <div className="stat">
            <span className="stat-label">Total</span>
            <span className="stat-value">{totalTodos}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Active</span>
            <span className="stat-value active">{activeTodos}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Completed</span>
            <span className="stat-value completed">{completedTodos}</span>
          </div>
        </div>

        <div className="input-section">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="todo-input"
            />
            <button onClick={addTodo} className="add-button">
              <span className="button-icon">+</span> Add
            </button>
          </div>
        </div>

        <div className="filter-section">
          <button
            onClick={() => setFilter('all')}
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          >
            All ({totalTodos})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`filter-button ${filter === 'active' ? 'active' : ''}`}
          >
            Active ({activeTodos})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`filter-button ${filter === 'completed' ? 'active' : ''}`}
          >
            Completed ({completedTodos})
          </button>
        </div>

        <div className="todo-list">
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p className="empty-text">
                {filter === 'all' ? 'No todos yet. Add one above!' :
                 filter === 'active' ? 'No active todos!' :
                 'No completed todos!'}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`todo-item ${todo.completed ? 'completed' : ''} ${
                  editingId === todo.id ? 'editing' : ''
                }`}
              >
                <div className="todo-content">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="todo-checkbox"
                  />
                  
                  {editingId === todo.id ? (
                    <div className="edit-section">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="edit-input"
                        autoFocus
                      />
                      <div className="edit-buttons">
                        <button onClick={saveEdit} className="save-button">
                          Save
                        </button>
                        <button onClick={cancelEdit} className="cancel-button">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`todo-text ${todo.completed ? 'completed-text' : ''}`}
                        onClick={() => toggleTodo(todo.id)}
                      >
                        {todo.text}
                      </span>
                      <div className="todo-actions">
                        <button
                          onClick={() => startEdit(todo.id, todo.text)}
                          className="action-button edit"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="action-button delete"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className="todo-meta">
                  <span className="todo-date">
                    Added: {todo.createdAt.toLocaleDateString()}
                  </span>
                  <span className={`todo-status ${todo.completed ? 'completed-status' : 'active-status'}`}>
                    {todo.completed ? '✅ Completed' : '⏳ In Progress'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {completedTodos > 0 && (
          <div className="footer">
            <button onClick={clearCompleted} className="clear-button">
              Clear Completed ({completedTodos})
            </button>
          </div>
        )}

        <div className="hint">
          <p>💡 Tips: Press Enter to add/edit, Escape to cancel editing</p>
          <p>✨ Data is automatically saved to your browser</p>
        </div>
      </div>
    </div>
  );
}

export default App;