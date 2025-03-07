// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

let store = {
	track_id: undefined,
	track_name: undefined,
	player_id: undefined,
	player_name: undefined,
	race_id: undefined,
}

document.addEventListener("DOMContentLoaded", function () {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	console.log("Getting form info for dropdowns!")
	try {
		const tracks = await getTracks();
		const html = renderTrackCards(tracks);
		renderAt('#tracks', html);

		const racers = await getRacers();
		const htmlRacers = renderRacerCars(racers);
		renderAt('#racers', htmlRacers);
	} catch (error) {
		console.log("Problem getting tracks and racers ::", error.message);
		console.error(error);
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function (event) {
		const { target } = event;

		if (target.matches('.card.track')) {
			handleSelectTrack(target);
			store.track_id = target.id;
			store.track_name = target.innerHTML;
		}

		if (target.matches('.card.racer')) {
			handleSelectRacer(target);
			store.player_id = target.id;
			store.player_name = target.innerHTML;
		}

		if (target.matches('#submit-create-race')) {
			event.preventDefault();

			handleCreateRace();
		}

		if (target.matches('#gas-peddle')) {
			handleAccelerate(store.race_id);
		}

		console.log("Store updated :: ", store);
	}, false);
}

async function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// ^ PROVIDED CODE ^ DO NOT REMOVE

// BELOW THIS LINE IS CODE WHERE STUDENT EDITS ARE NEEDED ----------------------------

async function handleCreateRace() {
	console.log("in create race");

	renderAt('#race', renderRaceStartView(store.track_name));

	const player_id = store.player_id;
	const track_id = store.track_id;
	console.log(`The player ID : ${player_id}, and the track ID : ${track_id}`);

	const race = await createRace(player_id, track_id); 

	store.race_id = race.ID;

	await runCountdown();

	await startRace(store.race_id);

	runRace(store.race_id);
}

async function runRace(raceID) {
	return new Promise((resolve, reject) => {
		let raceInfo = setInterval(async () => {
			try {
				const res = await getRace(raceID);
				console.log("Race status:", res.status);

				if (res.status === "in-progress") {
					renderAt("#leaderBoard", raceProgress(res.positions));

					// const playerPosition = res.positions.findIndex(p => p.id === parseInt(store.player_id));
					// if (playerPosition === 0) { 
					// 	clearInterval(raceInfo);
					// 	renderAt("#race", resultsView(res.positions));
					// 	resolve(res);
					// }
				} else if (res.status === "finished") {
					clearInterval(raceInfo);
					renderAt("#race", resultsView(res.positions));
					resolve(res);
				}
			} catch (error) {
				console.error("Error fetching race data:", error);
				clearInterval(raceInfo);
				reject(new Error("An error happened while getting the Race information"));
			}
		}, 500);
	});
}

async function runCountdown() {
	let timer = 3;

	return new Promise((resolve) => {
		const countingInt = setInterval(() => {
			document.getElementById('big-numbers').innerHTML = --timer;
			if (timer === 0) {
				clearInterval(countingInt);
				resolve(timer);
			}
		}, 1000);
	});
}

function handleSelectRacer(target) {
	console.log("selected a racer", target.id);

	const selected = document.querySelector('#racers .selected');
	if (selected) {
		selected.classList.remove('selected');
	}

	target.classList.add('selected');
}

function handleSelectTrack(target) {
	console.log("selected track", target.id);

	const selected = document.querySelector('#tracks .selected');
	if (selected) {
		selected.classList.remove('selected');
	}

	target.classList.add('selected');
}

function handleAccelerate(id) {
	console.log("accelerate button clicked");
	accelerate(id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</h4>
		`;
	}

	const results = racers.map(renderRacerCard).join('');

	return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
	const { id, driver_name } = racer;
	return `<h4 class="card racer" id="${id}">${driver_name}</h4>`;
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</h4>
		`;
	}

	const results = tracks.map(renderTrackCard).join('');

	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
	const { id, name } = track;

	return `<h4 id="${id}" class="card track">${name}</h4>`;
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track) {
	return `
		<header>
			<h1>Race: ${track}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
	let userPlayer = positions.find(p => p.id === parseInt(store.player_id));
	userPlayer.driver_name += " (you)";
	let count = 1;

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	});

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<h3>Race Results</h3>
			<p>The race is done! Here are the final results:</p>
			${results.join('')}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === parseInt(store.player_id));
	userPlayer.driver_name += " (you)";

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1);
	let count = 1;

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	});

	return `
		<table>
			${results.join('')}
		</table>
	`;
}

function renderAt(element, html) {
	const node = document.querySelector(element);
	node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001';

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': SERVER,
		},
	};
}

async function getTracks() {
	console.log(`calling server :: ${SERVER}/api/tracks`);
	try {
		const response = await fetch(`${SERVER}/api/tracks`, {
			method: "GET",
			...defaultFetchOpts()
		});
		const tracksJson = await response.json();
		return tracksJson;
	} catch (error) {
		console.log(`An error occurred while fetching tracks, ${error}`);
		return [];
	}
}

async function getRacers() {
	console.log(`calling server :: ${SERVER}/api/cars`);
	try {
		const response = await fetch(`${SERVER}/api/cars`, {
			method: 'GET',
			...defaultFetchOpts(),
		});
		const racersJson = await response.json();
		return racersJson;
	} catch (error) {
		console.log(`An error occurred while fetching racers, ${error}`);
		return [];
	}
}

async function createRace(player_id, track_id) {
	player_id = parseInt(player_id);
	track_id = parseInt(track_id);
	const body = { player_id, track_id };

	return await fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		body: JSON.stringify(body)
	})
		.then(async res => {
			let newVar = await res.json();
			return newVar;
		})
		.catch(err => console.log("Problem with createRace request::", err));
}

async function getRace(id) {
	try {
		const response = await fetch(`${SERVER}/api/races/${id}`, {
			method: 'GET',
			...defaultFetchOpts(),
		});
		
		const raceData = await response.json(); 
		return raceData;
	} catch (error) {
		console.error(`An error occurred while fetching race data:`, error);
		throw error; 
	}
}

async function startRace(race_id) {
	try {
		const response = await fetch(`${SERVER}/api/races/${race_id}/start`, {
			method: "POST",
			...defaultFetchOpts(),
		});

		if (!response.ok) {
			throw new Error(`Failed to start race. Status: ${response.status}`);
		}

		console.log(`Race with id ${race_id} started successfully.`);
	} catch (error) {
		console.error("Error in startRace function:", error);
	}
}

function accelerate(id) {
	fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: "POST",
		...defaultFetchOpts(),
	})
	.then(async () => {
		const race = await getRace(id);
		let racer = race.positions.find(p => p.id === parseInt(store.player_id));
		racer.speed = Math.min(racer.speed + racer.acceleration, racer.top_speed);
		racer.segment += Math.floor(racer.speed / 100);
		console.log(`The segment of current player : ${racer.segment}`);
	})
	.catch(error => console.log(`An error occurred while accelerating :: ${error}`));
}