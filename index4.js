// Selecting elements - IDs and classes corrected
const sidebar = document.getElementById('sidebar');
const logoImage = document.querySelector('.sidebar-logo .logo-img');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const voiceRecordBtn = document.getElementById('voice-record-btn'); // ADDED

// Elements for Media Options
const mediaOptionsBtn = document.getElementById('media-options-btn');
const mediaOptionsPopup = document.getElementById('media-options-popup');
const uploadDeviceOption = document.getElementById('upload-device-option');
const selectGalleryOption = document.getElementById('select-gallery-option');
const mediaInputAll = document.getElementById('media-input-all');
const mediaInputGallery = document.getElementById('media-input-gallery');

const searchBar = document.getElementById('search-bar');
const sidepanel = document.getElementById('sidepanel');
const clubRoom = document.getElementById('club-room');
const magRoom = document.getElementById('mag-tab');
const saveMessageRoom = document.getElementById('save-message-room'); // ADDED
const chatHeader = document.getElementById('chat-header');
const chatInputArea = document.getElementById('chat-input-area');
const chatContainer = document.getElementById('chat-container');

// Elements for Theme Toggle
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// Elements for Message Options Popup
const messageOptionsPopup = document.getElementById('message-options-popup'); // ADDED
const copyMessageOption = document.getElementById('copy-message-option'); // ADDED
const deleteMessageOption = document.getElementById('delete-message-option'); // ADDED
const saveMessageToRoomOption = document.getElementById('save-message-to-room-option'); // ADDED

let currentRoom = 'mag'; // Default active room
let mediaRecorder;
let recordedBlob = null;
let currentMessageElementForOptions = null; // Stores the message element currently selected for options

// Unified message data structure
let messagesData = JSON.parse(localStorage.getItem('chatMessagesData')) || {
    mag: [
        { sender: 'agent', text: 'به Exito Mag خوش آمدید! چگونه می‌توانم کمکتان کنم؟', type: 'text' }
    ],
    club: [
        { sender: 'agent', text: 'به Exito Club خوش آمدید! شما اینجا یک تماشاچی هستید.', type: 'text' }
    ],
    save: [] // ADDED: Data for Saved Messages
};

// Function to save messages to localStorage
function saveMessages() {
    localStorage.setItem('chatMessagesData', JSON.stringify(messagesData));
}

// Function to render messages for the current room
function renderMessages() {
    chatMessages.innerHTML = '';
    const roomMessages = messagesData[currentRoom];

    roomMessages.forEach((msg, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', msg.sender);
        messageDiv.dataset.index = index; // Store index for deletion/saving

        // Add long press/right click listener for agent/saved messages
        // Users can copy/delete/save agent messages or any messages in 'Saved Messages'
        if (msg.sender === 'agent' || currentRoom === 'save') {
            messageDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault(); // Prevent default right-click menu
                showDeleteCopySaveOptions(e, messageDiv);
            });
            let touchstartTime = 0;
            messageDiv.addEventListener('touchstart', (e) => {
                touchstartTime = new Date().getTime();
            });
            messageDiv.addEventListener('touchend', (e) => {
                const touchDuration = new Date().getTime() - touchstartTime;
                if (touchDuration > 500) { // If touch lasts longer than 500ms, consider it a long press
                    e.preventDefault();
                    showDeleteCopySaveOptions(e, messageDiv);
                }
            });
        }

        if (msg.type === 'media') {
            messageDiv.classList.add('media');
            if (msg.mediaType && msg.mediaType.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = msg.url;
                img.alt = msg.text || 'تصویر آپلود شده';
                messageDiv.appendChild(img);
            } else if (msg.mediaType && msg.mediaType.startsWith('audio/')) {
                const audio = document.createElement('audio');
                audio.src = msg.url;
                audio.controls = true;
                messageDiv.appendChild(audio);
            } else if (msg.mediaType && msg.mediaType.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = msg.url;
                video.controls = true;
                messageDiv.appendChild(video);
            } else { // Generic file
                const a = document.createElement('a');
                a.href = msg.url;
                a.textContent = `دانلود: ${msg.text || 'فایل'}`;
                a.target = '_blank';
                messageDiv.appendChild(a);
            }
        } else {
            messageDiv.textContent = msg.text;
        }
        chatMessages.appendChild(messageDiv);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
    filterMessages(); // Call filterMessages after rendering
}

// Function to add a new message to the current room's data
function addMessageToCurrentRoom(sender, text, type = 'text', url = null, mediaType = null) {
    const newMessage = { sender, text, type, url, mediaType };
    messagesData[currentRoom].push(newMessage);
    saveMessages();
    renderMessages();
    // Simulate agent response for 'mag' room if user sends a message
    if (currentRoom === 'mag' && sender === 'user') {
        setTimeout(() => {
            const agentResponse = type === 'media' ? 'فایل شما دریافت شد!' : 'پیام شما دریافت شد!';
            messagesData.mag.push({ sender: 'agent', text: agentResponse, type: 'text' });
            saveMessages();
            renderMessages();
        }, 1000);
    }
}

// --- Send and Voice Record Button Logic ---
chatInput.addEventListener('input', () => {
    // If chat input has text, show send button, hide voice record button
    if (chatInput.value.trim()) {
        sendBtn.classList.remove('hidden');
        sendBtn.classList.add('visible');
        voiceRecordBtn.classList.remove('visible');
        voiceRecordBtn.classList.add('hidden');
    } else { // If chat input is empty, show voice record button, hide send button
        sendBtn.classList.remove('visible');
        sendBtn.classList.add('hidden');
        voiceRecordBtn.classList.remove('hidden');
        voiceRecordBtn.classList.add('visible');
    }
});

sendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (text) { // Send text message
        addMessageToCurrentRoom('user', text);
        chatInput.value = ''; // Clear input
        // Reset buttons to default (microphone visible)
        sendBtn.classList.remove('visible');
        sendBtn.classList.add('hidden');
        voiceRecordBtn.classList.remove('hidden');
        voiceRecordBtn.classList.add('visible');
    } else if (recordedBlob) { // Send recorded voice message
        const url = URL.createObjectURL(recordedBlob);
        addMessageToCurrentRoom('user', 'پیام صوتی', 'media', url, recordedBlob.type);
        recordedBlob = null; // Clear recorded blob
        voiceRecordBtn.classList.remove('recording'); // Stop recording animation
        // Reset buttons to default (microphone visible)
        sendBtn.classList.remove('visible');
        sendBtn.classList.add('hidden');
        voiceRecordBtn.classList.remove('hidden');
        voiceRecordBtn.classList.add('visible');
    }
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim()) {
        sendBtn.click(); // Trigger send button click on Enter
    }
});

// --- Voice Recording Logic ---
voiceRecordBtn.addEventListener('click', async () => {
    if (currentRoom === 'save' || currentRoom === 'club') return; // Recording not allowed in Saved Messages or Club room

    if (voiceRecordBtn.classList.contains('recording')) {
        // Stop recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            voiceRecordBtn.classList.remove('recording');
        }
    } else {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                recordedBlob = new Blob(chunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop()); // Stop microphone access
                sendBtn.click(); // Trigger send to send the voice message
            };

            mediaRecorder.start();
            voiceRecordBtn.classList.add('recording'); // Show recording animation
            sendBtn.classList.remove('visible'); // Hide send button
            sendBtn.classList.add('hidden');
            // voiceRecordBtn remains visible and turns red
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('دسترسی به میکروفون امکان‌پذیر نیست. لطفا از اتصال آن اطمینان حاصل کرده و مجوزها را صادر کنید.');
        }
    }
});

// --- Media Options Button Logic ---
mediaOptionsBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent document click from closing it immediately
    if (currentRoom === 'save' || currentRoom === 'club') { // For Saved Messages or Club, directly open file explorer
        mediaInputAll.click();
    } else { // For other rooms, show the popup
        mediaOptionsPopup.classList.toggle('open');
    }
});

// Close media options popup when clicking outside
document.addEventListener('click', (e) => {
    if (mediaOptionsPopup.classList.contains('open') &&
        !mediaOptionsPopup.contains(e.target) &&
        !mediaOptionsBtn.contains(e.target)) {
        mediaOptionsPopup.classList.remove('open');
    }
});

// Handle click on "Upload from Device" option
uploadDeviceOption.addEventListener('click', () => {
    mediaInputAll.click();
    mediaOptionsPopup.classList.remove('open');
});

// Handle click on "Select from Gallery" option
selectGalleryOption.addEventListener('click', () => {
    mediaInputGallery.click();
    mediaOptionsPopup.classList.remove('open');
});

// Handle file input changes for all file types input
mediaInputAll.addEventListener('change', e => {
    if (currentRoom === 'save' || currentRoom === 'club') {
        alert('در این اتاق نمی‌توانید فایل آپلود کنید.');
        mediaInputAll.value = ''; // Clear selected files
        return;
    }
    const files = Array.from(e.target.files);
    files.forEach(file => {
        // Basic file size validation (e.g., 25MB limit)
        if (file.size > 25 * 1024 * 1024) {
            alert(`فایل "${file.name}" خیلی بزرگ است (حداکثر ۲۵ مگابایت).`);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            addMessageToCurrentRoom('user', file.name, 'media', event.target.result, file.type);
        };
        reader.readAsDataURL(file); // Read file as Data URL for display
    });
    mediaInputAll.value = ''; // Clear selected files after handling
});

// Handle file change for gallery input (images/videos)
mediaInputGallery.addEventListener('change', e => {
    if (currentRoom === 'save' || currentRoom === 'club') {
        alert('در این اتاق نمی‌توانید فایل آپلود کنید.');
        mediaInputGallery.value = ''; // Clear selected files
        return;
    }
    const files = Array.from(e.target.files);
    files.forEach(file => {
        // Basic file type and size validation
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            alert(`فایل "${file.name}" یک عکس یا ویدئو نیست.`);
            return;
        }
        if (file.size > 25 * 1024 * 1024) {
            alert(`فایل "${file.name}" خیلی بزرگ است (حداکثر ۲۵ مگابایت).`);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            addMessageToCurrentRoom('user', file.name, 'media', event.target.result, file.type);
        };
        reader.readAsDataURL(file); // Read file as Data URL for display
    });
    mediaInputGallery.value = ''; // Clear selected files after handling
});
// ... (existing selections)

const hamburgerMenuBtn = document.getElementById('hamburger-menu-btn'); // NEW SELECTION

// ... (existing let variables)

// --- Sidebar/Sidepanel Interaction Logic ---
let sidepanelTimeout;

// Function to handle opening sidepanel
function openSidepanel() {
    clearTimeout(sidepanelTimeout);
    sidepanel.classList.add('open');
    // Only add chat-container-shifted if screen is wide enough for the fixed sidebar/sidepanel layout
    if (window.innerWidth > 600) { // Check screen width
        chatContainer.classList.add('chat-container-shifted');
    }
}

// Function to handle closing sidepanel
function closeSidepanel() {
    sidepanelTimeout = setTimeout(() => {
        // Close only if neither sidebar nor sidepanel are hovered (for desktop)
        // Or if on mobile, and the close function is explicitly called (e.g. by clicking outside)
        if (window.innerWidth > 600) { // Desktop behavior
            if (!sidepanel.matches(':hover') && !sidebar.matches(':hover')) {
                sidepanel.classList.remove('open');
                chatContainer.classList.remove('chat-container-shifted');
            }
        } else { // Mobile behavior - always close if called
            sidepanel.classList.remove('open');
            // No need to remove chat-container-shifted on mobile as it's not applied
        }
    }, 50);
}

// Desktop hover logic (only applies to screens wider than 600px)
sidebar.addEventListener('mouseenter', () => {
    if (window.innerWidth > 600) {
        openSidepanel();
    }
});

sidebar.addEventListener('mouseleave', () => {
    if (window.innerWidth > 600) {
        closeSidepanel();
    }
});

sidepanel.addEventListener('mouseleave', () => {
    if (window.innerWidth > 600) {
        closeSidepanel();
    }
});

sidepanel.addEventListener('mouseenter', () => {
    if (window.innerWidth > 600) {
        openSidepanel();
    }
});

// Logo click to toggle sidepanel (Desktop only as alternative to hover)
// On mobile, the logo is not the primary trigger anymore
logoImage.addEventListener('click', () => {
    if (window.innerWidth > 600) { // Only for desktop
        sidepanel.classList.toggle('open');
        chatContainer.classList.toggle('chat-container-shifted');
    }
    // Mobile logic for logo click not needed here as hamburger will handle it
});


// NEW: Hamburger menu button for mobile
hamburgerMenuBtn.addEventListener('click', () => {
    sidepanel.classList.toggle('open');
    // On mobile, chat-container-shifted is not used, sidepanel overlays
});


// Close sidepanel when clicking outside on mobile (if open)
document.addEventListener('click', (e) => {
    // Check if sidepanel is open and click is outside sidepanel and hamburger button
    if (window.innerWidth <= 600 && sidepanel.classList.contains('open')) {
        if (!sidepanel.contains(e.target) && !hamburgerMenuBtn.contains(e.target)) {
            sidepanel.classList.remove('open');
        }
    }
    // Also handle closing media options popup here
    if (mediaOptionsPopup.classList.contains('open') &&
        !mediaOptionsPopup.contains(e.target) &&
        !mediaOptionsBtn.contains(e.target)) {
        mediaOptionsPopup.classList.remove('open');
    }
    // And message options popup here
    if (messageOptionsPopup.classList.contains('open') &&
        !messageOptionsPopup.contains(e.target) &&
        !currentMessageElementForOptions.contains(e.target)) { // Make sure click is not on the message itself
        messageOptionsPopup.classList.remove('open');
        if (currentMessageElementForOptions) {
            currentMessageElementForOptions.classList.remove('selected-for-options');
            currentMessageElementForOptions = null;
        }
    }
});


// Optional: Add a listener for window resize to adjust behavior dynamically
window.addEventListener('resize', () => {
    if (window.innerWidth <= 600) {
        // If resizing to mobile view, ensure sidepanel is closed and chat container is not shifted
        sidepanel.classList.remove('open');
        chatContainer.classList.remove('chat-container-shifted');
    }
});

// ... rest of your JS code ...

// In renderMessages function, if you added specific long press logic for agent/saved messages:
// Make sure to consider mobile vs desktop for context menu/long press
// For mobile, touchstart/touchend is crucial. For desktop, contextmenu (right-click)

// Inside `showDeleteCopySaveOptions` (where you add/remove `selected-for-options`):
// Make sure `currentMessageElementForOptions` is cleared correctly when the popup closes.

// --- Message Search Logic ---
function filterMessages() {
    const searchTerm = searchBar.value.toLowerCase();
    const messages = chatMessages.querySelectorAll('.message'); // Get all message elements

    messages.forEach(messageDiv => {
        const messageText = messageDiv.textContent.toLowerCase();
        if (messageText.includes(searchTerm)) {
            messageDiv.style.display = 'flex'; // Show message
        } else {
            messageDiv.style.display = 'none'; // Hide message
        }
    });
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom after filtering
}
searchBar.addEventListener('input', filterMessages);


// --- Sidebar/Sidepanel Interaction Logic ---

sidebar.addEventListener('mouseenter', () => {
    clearTimeout(sidepanelTimeout);
    sidepanel.classList.add('open');
    chatContainer.classList.add('chat-container-shifted'); // Use new class
});

sidebar.addEventListener('mouseleave', () => {
    sidepanelTimeout = setTimeout(() => {
        if (!sidepanel.matches(':hover') && !sidebar.matches(':hover')) {
            sidepanel.classList.remove('open');
            chatContainer.classList.remove('chat-container-shifted'); // Use new class
        }
    }, 50);
});

sidepanel.addEventListener('mouseleave', () => {
    sidepanelTimeout = setTimeout(() => {
        if (!sidebar.matches(':hover') && !sidepanel.matches(':hover')) {
            sidepanel.classList.remove('open');
            chatContainer.classList.remove('chat-container-shifted'); // Use new class
        }
    }, 50);
});

sidepanel.addEventListener('mouseenter', () => {
    clearTimeout(sidepanelTimeout);
    sidepanel.classList.add('open');
    chatContainer.classList.add('chat-container-shifted'); // Use new class
});

// Logo click to toggle sidepanel (alternative to hover)
logoImage.addEventListener('click', () => {
    sidepanel.classList.toggle('open');
    chatContainer.classList.toggle('chat-container-shifted');
});


// --- Toggling between chat rooms ---
function switchRoom(roomName) {
    // Remove 'selected' from all rooms
    document.querySelectorAll('.chat-room').forEach(room => {
        room.classList.remove('selected');
    });

    // Add 'selected' to the clicked room and update currentRoom
    if (roomName === 'mag') {
        magRoom.classList.add('selected');
        currentRoom = 'mag';
        chatHeader.querySelector('h2').textContent = 'Exito Mag';
        chatHeader.querySelector('img').src = '../src/logo.png'; // Assuming same logo for Mag
    } else if (roomName === 'club') {
        clubRoom.classList.add('selected');
        currentRoom = 'club';
        chatHeader.querySelector('h2').textContent = 'Exito Club';
        chatHeader.querySelector('img').src = '../src/logo.png'; // Assuming same logo for Club
    } else if (roomName === 'save') { // ADDED: Saved Messages room
        saveMessageRoom.classList.add('selected');
        currentRoom = 'save';
        chatHeader.querySelector('h2').textContent = 'Saved Messages';
        chatHeader.querySelector('img').src = '../src/logo.png'; // Assuming same logo for Saved Messages
    }

    // Hide/Show chat input area based on room
    if (currentRoom === 'save' || currentRoom === 'club') { // Club also cannot send messages
        chatInputArea.style.display = 'none';
    } else {
        chatInputArea.style.display = 'flex';
    }

    renderMessages();
    mediaOptionsPopup.classList.remove('open'); // Close media popup when changing rooms
    
    // Ensure button state is correct after room switch
    chatInput.value = ''; // Clear input on room switch
    chatInput.dispatchEvent(new Event('input')); // Trigger input event to update button visibility
}

clubRoom.addEventListener('click', () => switchRoom('club'));
magRoom.addEventListener('click', () => switchRoom('mag'));
saveMessageRoom.addEventListener('click', () => switchRoom('save')); // ADDED Event Listener


// --- Theme Toggle Logic ---
function applyTheme(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Event listener for theme toggle button
themeToggleBtn.addEventListener('click', () => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    applyTheme(!isDarkMode); // Toggle the current mode
    localStorage.setItem('darkModeEnabled', !isDarkMode); // Save preference
});

// Load theme preference on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('darkModeEnabled');
    if (savedTheme === 'true') {
        applyTheme(true);
    } else {
        applyTheme(false); // Apply light mode as default or based on false value
    }
    // Initial setup on page load
    switchRoom('mag'); // Set initial room state and render messages
    chatInput.value = ''; // Ensure input is empty on load
    chatInput.dispatchEvent(new Event('input')); // Trigger input event to set initial button state
});


// --- Message Options Pop-up (Copy, Delete, Save) ---
// Function to show message options popup
function showDeleteCopySaveOptions(e, messageElement) {
    // Deselect any previously selected message
    if (currentMessageElementForOptions) {
        currentMessageElementForOptions.classList.remove('selected-for-options');
    }

    currentMessageElementForOptions = messageElement;
    currentMessageElementForOptions.classList.add('selected-for-options');

    // Position the popup based on mouse/touch coordinates
    // Adjust position if it goes off-screen
    let popupX = e.clientX || e.touches[0].clientX;
    let popupY = e.clientY || e.touches[0].clientY;

    // Get popup dimensions
    messageOptionsPopup.style.display = 'flex'; // Temporarily show to get dimensions
    const popupWidth = messageOptionsPopup.offsetWidth;
    const popupHeight = messageOptionsPopup.offsetHeight;
    messageOptionsPopup.style.display = 'none'; // Hide again

    // Check boundaries
    if (popupX + popupWidth > window.innerWidth) {
        popupX = window.innerWidth - popupWidth - 10; // 10px margin
    }
    if (popupY + popupHeight > window.innerHeight) {
        popupY = window.innerHeight - popupHeight - 10; // 10px margin
    }

    messageOptionsPopup.style.left = `${popupX}px`;
    messageOptionsPopup.style.top = `${popupY}px`;
    messageOptionsPopup.classList.add('open');

    // Adjust visibility of 'Save Message' option
    if (currentRoom === 'save') {
        saveMessageToRoomOption.style.display = 'none';
    } else {
        saveMessageToRoomOption.style.display = 'flex';
    }
}

// Function to copy message text
copyMessageOption.addEventListener('click', () => {
    if (currentMessageElementForOptions) {
        // Extract text from the message, handling media messages
        let textToCopy = currentMessageElementForOptions.textContent;
        // If it's a media message, try to get its alt text or a descriptive name
        if (currentMessageElementForOptions.classList.contains('media')) {
            const img = currentMessageElementForOptions.querySelector('img');
            const a = currentMessageElementForOptions.querySelector('a');
            if (img) textToCopy = img.alt || `[Image: ${img.src.split('/').pop()}]`;
            else if (a) textToCopy = a.textContent || `[File: ${a.href.split('/').pop()}]`;
            else textToCopy = '[Media Message]';
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('پیام کپی شد!');
            messageOptionsPopup.classList.remove('open');
            currentMessageElementForOptions.classList.remove('selected-for-options');
            currentMessageElementForOptions = null;
        }).catch(err => {
            console.error('Failed to copy message: ', err);
            alert('کپی پیام با شکست مواجه شد.');
            messageOptionsPopup.classList.remove('open');
            currentMessageElementForOptions.classList.remove('selected-for-options');
            currentMessageElementForOptions = null;
        });
    }
});

// Function to delete message
deleteMessageOption.addEventListener('click', () => {
    if (currentMessageElementForOptions) {
        const indexToDelete = parseInt(currentMessageElementForOptions.dataset.index);
        messagesData[currentRoom].splice(indexToDelete, 1);
        saveMessages();
        renderMessages();
        messageOptionsPopup.classList.remove('open');
        currentMessageElementForOptions = null;
    }
});

// Function to save message to 'Saved Messages' room
saveMessageToRoomOption.addEventListener('click', () => {
    if (currentMessageElementForOptions && currentRoom !== 'save') {
        const indexToSave = parseInt(currentMessageElementForOptions.dataset.index);
        const messageToSave = messagesData[currentRoom][indexToSave];

        // Check if message already exists in saved messages to prevent duplicates
        const alreadySaved = messagesData.save.some(savedMsg =>
            savedMsg.text === messageToSave.text &&
            savedMsg.type === messageToSave.type &&
            savedMsg.url === messageToSave.url
        );

        if (!alreadySaved) {
            messagesData.save.push({ ...messageToSave, sender: 'agent' }); // Saved messages appear as agent for consistency
            saveMessages();
            alert('پیام در "Saved Messages" ذخیره شد!');
        } else {
            alert('این پیام از قبل در "Saved Messages" شما موجود است.');
        }
        messageOptionsPopup.classList.remove('open');
        currentMessageElementForOptions.classList.remove('selected-for-options');
        currentMessageElementForOptions = null;
    } else if (currentRoom === 'save') {
        alert('پیام‌ها در "Saved Messages" را نمی‌توان دوباره ذخیره کرد.');
        messageOptionsPopup.classList.remove('open');
        currentMessageElementForOptions.classList.remove('selected-for-options');
        currentMessageElementForOptions = null;
    }
});

// Close message options popup when clicking elsewhere
document.addEventListener('click', (e) => {
    if (messageOptionsPopup.classList.contains('open') &&
        !messageOptionsPopup.contains(e.target) &&
        (!currentMessageElementForOptions || !currentMessageElementForOptions.contains(e.target))) { // Check if message was clicked
        messageOptionsPopup.classList.remove('open');
        if (currentMessageElementForOptions) {
            currentMessageElementForOptions.classList.remove('selected-for-options');
            currentMessageElementForOptions = null;
        }
    }
});

// Hide message options on scroll of chat messages
chatMessages.addEventListener('scroll', () => {
    if (messageOptionsPopup.classList.contains('open')) {
        messageOptionsPopup.classList.remove('open');
        if (currentMessageElementForOptions) {
            currentMessageElementForOptions.classList.remove('selected-for-options');
            currentMessageElementForOptions = null;
        }
    }
});