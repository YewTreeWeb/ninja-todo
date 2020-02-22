// Import externals
import 'airbnb-browser-shims';

// Import internals
import './modules/helpers';

// Todo List.

const addForm = document.querySelector('.add');
const list = document.querySelector('.list-group');

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

// delete todo
list.addEventListener('click', (e) => {
	if (e.target.classList.contains('delete')) {
		console.log('delete');
		console.log(e);
		e.target.parentElement.remove();
	}
});

// Add new todo
addForm.addEventListener('submit', (e) => {
	e.preventDefault();
	const todo = addForm.add.value.trim();

	if (todo.length) {
		console.log(todo);
		generateTemplate(todo);
		addForm.reset();
	}
});
