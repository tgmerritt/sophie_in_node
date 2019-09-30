let uneeqReady = false;
let devices = null;
let selectedMic = null;
let selectedCam = null;
let selectedSpeaker = null;
const baseUrl = 'https://dal-eeva.faceme.com';
const tokenEndpoint = '/api/v1/clients/access/tokens/';

const uneeq = new Uneeq({
    url: 'https://dal-admin.faceme.com',
    conversationId: '60ec5c4c-dc03-4b9f-9036-4ee85f21d7fe',
    avatarVideoContainerElement: document.getElementById('avatar-container'),
    localVideoContainerElement: document.getElementById('local-container'),
    customData: {},
    apiKey: "key_here",
    logging: true
});

let token = document.getElementById('single-use-token').dataset.token;

uneeq.initWithToken(token);

function switchText() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        document.getElementById('prompt').innerHTML = "Press and hold screen to speak";
    } else {
        document.getElementById('prompt').innerHTML = "Hold <b>space</b> to speak.";
    }
}

switchText();

function uneeqReadyHandler() {
    addKeyListeners();
    uneeqReady = true;
}

function addListeningText() {
    document.getElementById('prompt').innerHTML = "Listening...";
}

function addActivePrompt() {
    document.getElementById('prompt').removeAttribute('class', 'prompt');
    addListeningText();
    document.getElementById('prompt').setAttribute('class', 'prompt-active');
}

function addNonActivePrompt() {
    document.getElementById('prompt').removeAttribute('class', 'prompt-active');
    switchText();
    document.getElementById('prompt').setAttribute('class', 'prompt');
}

function addAvatarTranscript(msg) {
    let newElement = document.createElement('div');
    newElement.classList.add('transcript-msg');
    newElement.innerHTML = msg;
    const transcript = document.getElementById('transcript');
    transcript.appendChild(newElement);
    transcript.scrollTop = transcript.scrollHeight;
}

function updateDeviceList() {
    const addOptionToSelect = (device, selectElem) => {
        const option = document.createElement('option');
        option.innerHTML = device.label;
        option.value = device.deviceId;
        selectElem.appendChild(option);
    };
    if (devices && devices.videoInput) {
        // Set a default camera if there isn't one
        if (selectedCam === null && devices.videoInput.length > 0) {
            selectedCam = devices.videoInput[0].deviceId;
        }
        const selectElem = document.getElementById('cameraSelect');
        selectElem.innerHTML = '';
        devices.videoInput.forEach((cam) => addOptionToSelect(cam, selectElem));
        selectElem.value = selectedCam;
    }
    if (devices && devices.audioInput) {
        // Set a default microphone if there isn't one
        if (selectedMic === null && devices.audioInput.length > 0) {
            selectedMic = devices.audioInput[0].deviceId;
        }
        const selectElem = document.getElementById('micSelect');
        selectElem.innerHTML = '';
        devices.audioInput.forEach((mic) => addOptionToSelect(mic, selectElem));
        selectElem.value = selectedMic;
    }
    if (devices && devices.audioOutput) {
        // Set a default speaker if there isn't one
        if (selectedSpeaker === null && devices.audioOutput.length > 0) {
            selectedSpeaker = devices.audioOutput[0].deviceId;
        }
        const selectElem = document.getElementById('speakerSelect');
        selectElem.innerHTML = '';
        devices.audioOutput.forEach((speaker) => addOptionToSelect(speaker, selectElem));
        selectElem.value = selectedSpeaker;
    }
}

function addKeyListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.repeat && e.target.type !== 'text') {
            addActivePrompt()
            uneeq.startRecording();
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && !e.repeat && e.target.type !== 'text') {
            addNonActivePrompt();
            uneeq.stopRecording();
        }
    });

    let touchScreen = document.getElementById('avatar-container');
    touchScreen.addEventListener('touchstart', pressingDown, false);
    touchScreen.addEventListener('touchend', notPressingDown, false);

    function pressingDown() {
        addActivePrompt();
        uneeq.startRecording();
    }

    function notPressingDown() {
        addNonActivePrompt();
        uneeq.stopRecording();
    }
}

function askKeyPress(e) {
    if (e.key === 'Enter' && uneeq.ready.value === true) {
        console.log("Sending transcript to Uneeq: " + document.getElementById('askInput').value);
        uneeq.sendTranscript(document.getElementById('askInput').value);
        document.getElementById('askInput').value = '';
    }
}

function showSettings() {
    document.getElementById('settings').classList.add('show');
    updateDeviceList();
}

function hideSettings() {
    document.getElementById('settings').classList.remove('show');
}

function setPauseState(paused) {
    if (paused) {
        uneeq.pauseSession();
        document.getElementById('pause-btn').style.display = 'none';
        document.getElementById('resume-btn').style.display = 'block';
    } else {
        uneeq.resumeSession();
        document.getElementById('pause-btn').style.display = 'block';
        document.getElementById('resume-btn').style.display = 'none';
    }
}

uneeq.messages.subscribe((msg) => {
    switch (msg.uneeqMessageType) {
        case 'RecordingStarted':
            console.log('RecordingStarted');
            break;
        case 'RecordingStopped':
            console.log('RecordingStopped');
            break;
        case 'Ready':
            uneeqReadyHandler();
            break;
        case 'DevicePermissionAllowed':
            console.log('User allowed permission to devices');
            break;
        case 'AvatarQuestionText':
            document.getElementById('local-transcript').innerHTML = msg.question;
            break;
        case 'AvatarAnswerText':
            addAvatarTranscript(msg.answer);
            break;
        case 'AvatarTextInputFinished':
            console.log('Avatar Text Input Finished');
            break;
        case 'AvatarUnavailable':
            document.getElementById('msg').innerHTML = 'Avatar Unavailable. Session will begin when an avatar becomes available.';
            break;
        case 'AvatarAvailable':
            document.body.classList.add('live');
            document.getElementById('msg').innerHTML = 'Loading...';
            break;
        case 'AvatarAnswerContent':
            document.getElementById('injectHTML').innerHTML = msg.content;
            break;
        case 'DeviceListUpdated':
            devices = msg.devices;
            updateDeviceList();
            break;
        case 'SetMicSuccess':
            selectedMic = msg.deviceId;
            break;
        case 'SetCamSuccess':
            selectedCam = msg.deviceId;
            break;
        case 'SetSpeakerSuccess':
            selectedSpeaker = msg.deviceId;
            break;
        case 'SessionLive':
            console.log('Session established');
            break;
        case 'SessionEnded':
            document.getElementById('msg').innerHTML = 'Session Ended.';
            break;
        case 'SessionError':
            console.log("SessionError: " + msg.error);
            break;
        case 'ErrorEndingSession':
            console.error(msg.error);
            break;
        case 'SessionPaused':
            console.log("SessionPaused");
            break;
        case 'SessionResumed':
            console.log("SessionResumed");
            break;
        case 'AvatarAnswer':
            console.log('AvatarAnswer');
            break;
        default:
            console.log('Uneeq: Unhandled message \'' + msg.uneeqMessageType + '\'');
            break;
    }
});