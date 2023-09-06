const defaultOutput = [{label: 'Default', deviceId: 'default'}];

const context = new AudioContext();

const audio = new Audio();

const dest = context.createMediaStreamDestination();
audio.srcObject = dest.stream;

const gain = context.createGain();
gain.gain.value = 0.2;
gain.connect(dest);

const tone = context.createOscillator();
tone.frequency.value = 800;

async function handleDevicesChange() {
	const inputEl = document.getElementById('input');
	const outputEl = document.getElementById('output');

	const devices = await navigator.mediaDevices.enumerateDevices();
	const input = devices.filter(({ kind }) => kind === 'audioinput');
	const output = devices.filter(({ kind }) => kind === 'audiooutput');

	inputEl.innerHTML = [
		{ label: 'None', deviceId: '' },
		{ label: 'Tone', deviceId: 'TONE' },
		...input,
	].map(
		({ label, deviceId }) => `<option value="${deviceId}">${label || deviceId}</option>`,
	).join('');

	outputEl.innerHTML = [
		{ label: 'None', deviceId: 'NONE' },
    ...(output.length > 0 ? output : defaultOutput),
	].map(
		({ label, deviceId }) => `<option value="${deviceId}">${label || deviceId}</option>`,
	).join('');
}

let currentInput;
async function handleInputChange({ target }) {
	const { value } = target;

	if (currentInput) {
		currentInput.disconnect(gain);
	}

	if (value === 'TONE') {
		currentInput = tone;
	} else {
		const device = await navigator.mediaDevices.getUserMedia({
			audio: { deviceId: value },
		});
		currentInput = context.createMediaStreamSource(device);
	}

	currentInput.connect(gain);
}

function handleGainChange({ target }) {
	const { value } = target;

	gain.gain.value = value;
}

function handleOutputChange({ target }) {
	const { value } = target;

	if (value !== 'NONE') {
    // Check for firefox without flags enabled
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId
		if(audio.setSinkId) {
      audio.setSinkId(value === 'default' ? '' : value);
    }
		audio.play();
	} else {
		audio.pause();
	}
}

function handleFirstClick() {
	document.removeEventListener('click', handleFirstClick);
	tone.start();
}

document.addEventListener('click', handleFirstClick);
navigator.mediaDevices.addEventListener('devicechange', handleDevicesChange);
navigator.mediaDevices.getUserMedia({ audio: true }).then(handleDevicesChange);
handleDevicesChange();
