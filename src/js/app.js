// Import externals
import 'airbnb-browser-shims';

// Import internals
import './modules/helpers';

// Todo List.

const addForm = document.querySelector('.add');
const list = document.querySelector('.todos');
const noTodo = document.querySelector('.no-todos');
const todos = [];

// Add new todo to the existing list.
const generateTemplate = (todo) => {
	const html = `
	<li class="list-group-item d-flex justify-content-between align-items-center">
	<span>${todo}</span>
	<i class="far fa-trash-alt delete"></i>
	</li>
	`;
	list.innerHTML += html;
};

// Grab search term and filter.
const filterTodos = (term) => {
	Array.from(list.children)
		.filter((todo) => !todo.textContent.toLowerCase().includes(term))
		.forEach((todo) => todo.classList.add('filtered'));
	Array.from(list.children)
		.filter((todo) => todo.textContent.toLowerCase().includes(term))
		.forEach((todo) => todo.classList.remove('filtered'));
};

// Add item to localStorage.
const saveTodo = () => {
	const parsed = JSON.stringify(todos);
	localStorage.setItem('todos', parsed);
};

// delete todo
list.addEventListener('click', (e) => {
	if (e.target.classList.contains('delete')) {
		const target = e.target.parentElement.textContent.trim();
		e.target.parentElement.remove();
		// Look through the todos array and compare with e.target.
		// If a match remove it from storage.
		todos.forEach((todo, index) => {
			try {
				if (todo.title === target) {
					todos.splice(index, 1);
					console.log(todos.length);
					if (todos.length === 0) {
						noTodo.classList.remove('hide');
						list.classList.add('hide');
					}
					saveTodo();
				}
			} catch (e) {
				if (window.console) {
					console.error(e);
				}
			}
		});
	}
});

// Add new todo
addForm.addEventListener('submit', (e) => {
	e.preventDefault();
	const todo = addForm.add.value.trim();
	if (list.classList.contains('hide')) {
		list.classList.remove('hide');
	}
	if (todo.length) {
		generateTemplate(todo);
		// Add the new value to the todos array.
		todos.push({
			title: todo
		});
		saveTodo();
		addForm.reset();
	}
	if (todos.length > 0 && !noTodo.classList.contains('hide')) {
		noTodo.classList.add('hide');
	}
});

// Keyup search
const search = document.querySelector('.search input');

search.addEventListener('keyup', () => {
	const term = search.value.trim().toLowerCase();
	filterTodos(term);
});

// Check local storage
if (typeof localStorage !== 'undefined') {
	if (localStorage.getItem('todos')) {
		try {
			// Get the keys within storage and add them to the todo list.
			const savedTodo = JSON.parse(localStorage.getItem('todos'));
			if (!noTodo.classList.contains('hide')) {
				noTodo.classList.add('hide');
			}
			savedTodo.forEach((todo) => {
				todos.push(todo);
				generateTemplate(todo.title);
			});
		} catch (e) {
			localStorage.removeItem('todos');
			if (noTodo.classList.contains('hide')) {
				noTodo.classList.remove('hide');
			}
			list.classList.add('hide');
			if (window.console) {
				console.error(e);
			}
		}
	}
}
