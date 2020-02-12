// Import externals
import 'airbnb-browser-shims';

// Import internals
import './modules/helpers';

// Quiz
const correctAnswers = [ 'B', 'B', 'B', 'B' ];
const form = document.querySelector('.quiz-form');
const result = document.querySelector('.score');
const resultContent = document.querySelector('.score__content');

form.addEventListener('submit', (e) => {
	e.preventDefault();

	let score = 0;
	const userAnswers = [ form.q1.value, form.q2.value, form.q3.value, form.q4.value ];
	const resultNum = resultContent.querySelector('.score__number');
	const resultTxt = resultContent.querySelector('h3');

	// Checks user answers with correct ones.
	userAnswers.forEach((answer, index) => {
		if (answer === correctAnswers[index]) {
			score += 25;
		}
	});

	scrollTo({
		top: 0,
		behavior: 'smooth'
	});

	if (score <= 0 && result.classList.contains('score--expanded')) {
		resultContent.style.opacity = '0';
		setTimeout(() => {
			result.style.maxHeight = '0px';
			result.classList.remove('score--expanded');
			result.setAttribute('aria-expanded', 'false');
			setTimeout(() => {
				resultContent.style.display = 'none';
				result.style.display = 'none';
			}, 300);
		}, 200);
	} else {
		if (!result.classList.contains('score--expanded')) {
			result.style.display = 'block';
			result.style.maxHeight = '69px';
			result.classList.add('score--expanded');
			result.setAttribute('aria-expanded', 'true');
			let height = Math.ceil(result.offsetHeight + 100) + 'px';
			result.style.maxHeight = '0px';
			setTimeout(() => {
				resultContent.style.display = 'block';
				result.style.maxHeight = height;
				setTimeout(() => {
					resultContent.style.opacity = '1';
				}, 300);
			}, 0);
		}

		let output = 0;
		const timer = setInterval(() => {
			resultNum.textContent = `${output}%`;
			if (output === score) {
				clearInterval(timer);
			} else {
				output++;
			}
		}, 55);
	}
});
