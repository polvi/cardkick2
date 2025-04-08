if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('ServiceWorker registered');
            // Check if there's an update available
            registration.update();
        })
        .catch(err => console.log('ServiceWorker registration failed: ', err));
}

// Add offline/online event handlers
window.addEventListener('online', function() {
    document.body.classList.remove('offline');
});

window.addEventListener('offline', function() {
    document.body.classList.add('offline');
});

// Check initial online status
if (!navigator.onLine) {
    document.body.classList.add('offline');
}

// Initialize profiles if not exists
function initializeProfiles() {
    const profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
    if (Object.keys(profiles).length === 0) {
        profiles.personal = { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0', contactCards: {} };
        profiles.business = { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0', contactCards: {} };
        localStorage.setItem('profiles', JSON.stringify(profiles));
        
        // Show intro message for new users
        const seoContent = document.getElementById('seoContent');
        if (seoContent) {
            seoContent.style.display = 'block';
        }
    } else {
        // Check if any profile has data
        const hasData = Object.values(profiles).some(profile => profile.name || profile.email || profile.phone);
        const seoContent = document.getElementById('seoContent');
        if (seoContent) {
            seoContent.style.display = hasData ? 'none' : 'block';
        }
    }
    return profiles;
}

// Check for saved data and show appropriate view
function checkSavedData() {
    const profiles = initializeProfiles();
    const currentProfile = document.getElementById('profileSelect').value;
    const profileData = profiles[currentProfile] || { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0' };
    
    if (profileData && profileData.name) {
        const color = profileData.color || '#f0f0f0';
        document.querySelector('.container').style.backgroundColor = color;
        document.documentElement.style.setProperty('--theme-color', '#4CAF50');
        document.documentElement.style.setProperty('--theme-color-hover', adjustColor(color, -10));
        document.getElementById('formSection').style.display = 'none';
        document.getElementById('displaySection').style.display = 'block';
        document.getElementById('displayName').textContent = profileData.name;
        document.getElementById('displayEmail').textContent = profileData.email;
        document.getElementById('displayPhone').textContent = profileData.phone;
        const linkedinContainer = document.getElementById('linkedinContainer');
        if (profileData.linkedin) {
            document.getElementById('displayLinkedin').textContent = profileData.linkedin;
            linkedinContainer.style.display = 'block';
        } else {
            linkedinContainer.style.display = 'none';
        }
        // Ensure QR code is generated with a small delay to allow for library loading
        setTimeout(() => {
            generateQRCode(profileData);
        }, 100);
    } else {
        document.getElementById('formSection').style.display = 'block';
        document.getElementById('displaySection').style.display = 'none';
    }
}

function generateQRCode(data, retryCount = 0) {
    // Clear any existing error messages
    document.getElementById('qrcode').innerHTML = '';
    
    try {
        if (typeof qrcode === 'undefined') {
            if (!navigator.onLine) {
                throw new Error('You are offline. Please check your internet connection.');
            }
            if (retryCount < 5) {
                console.log('QR code library not loaded, retrying in 300ms...');
                setTimeout(() => generateQRCode(data, retryCount + 1), 300);
                return;
            }
            throw new Error('QR code library failed to load');
        }

        // Validate required data
        if (!data || !data.name || !data.phone || !data.email) {
            throw new Error('Missing required contact information');
        }

        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${data.name}
TEL:${data.phone}
EMAIL:${data.email}
URL:${data.linkedin}
END:VCARD`;
    
        const qr = qrcode(0, 'L');
        qr.addData(vcard);
        qr.make();
        document.getElementById('qrcode').innerHTML = qr.createImgTag(4);
    } catch (error) {
        console.error('QR code generation failed:', error);
        document.getElementById('qrcode').innerHTML = '<p style="color: red;">Failed to generate QR code. Please try again.</p>';
    }
}

document.getElementById('editButton').addEventListener('click', function() {
    const profiles = JSON.parse(localStorage.getItem('profiles')) || {};
    const currentProfile = document.getElementById('profileSelect').value;
    const profileData = profiles[currentProfile] || { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0' };
    
    document.getElementById('name').value = profileData.name || '';
    document.getElementById('email').value = profileData.email || '';
    document.getElementById('phone').value = profileData.phone || '';
    document.getElementById('linkedin').value = profileData.linkedin || '';
    document.getElementById('profileColor').value = profileData.color || '#f0f0f0';
    document.getElementById('formSection').style.display = 'block';
    document.getElementById('displaySection').style.display = 'none';
});

// Contact card management functions
function addContactCard(name) {
    const profiles = JSON.parse(localStorage.getItem('profiles'));
    const currentProfile = document.getElementById('profileSelect').value;
    
    if (!profiles[currentProfile].contactCards) {
        profiles[currentProfile].contactCards = {};
    }
    
    profiles[currentProfile].contactCards[name] = {
        name: name,
        email: '',
        phone: '',
        notes: ''
    };
    
    localStorage.setItem('profiles', JSON.stringify(profiles));
    updateContactCardsList();
}

function updateContactCardsList() {
    const profiles = JSON.parse(localStorage.getItem('profiles'));
    const currentProfile = document.getElementById('profileSelect').value;
    const contactCards = profiles[currentProfile].contactCards || {};
    const container = document.getElementById('contactCardsList');
    
    container.innerHTML = '';
    
    Object.keys(contactCards).forEach(name => {
        const card = contactCards[name];
        const cardElement = document.createElement('div');
        cardElement.className = 'contact-card';
        cardElement.innerHTML = `
            <h4>${card.name}</h4>
            <p>${card.email || 'No email'}</p>
            <p>${card.phone || 'No phone'}</p>
            <button onclick="editContactCard('${name}')" class="secondary">Edit</button>
            <button onclick="generateCardQR('${name}')" class="secondary">QR Code</button>
        `;
        container.appendChild(cardElement);
    });
}

function editContactCard(name) {
    const profiles = JSON.parse(localStorage.getItem('profiles'));
    const currentProfile = document.getElementById('profileSelect').value;
    const card = profiles[currentProfile].contactCards[name];
    
    const email = prompt('Enter email:', card.email || '');
    const phone = prompt('Enter phone:', card.phone || '');
    const notes = prompt('Enter notes:', card.notes || '');
    
    if (email !== null && phone !== null) {
        profiles[currentProfile].contactCards[name] = {
            name,
            email,
            phone,
            notes
        };
        localStorage.setItem('profiles', JSON.stringify(profiles));
        updateContactCardsList();
    }
}

function generateCardQR(name) {
    const profiles = JSON.parse(localStorage.getItem('profiles'));
    const currentProfile = document.getElementById('profileSelect').value;
    const card = profiles[currentProfile].contactCards[name];
    
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${card.name}
TEL:${card.phone}
EMAIL:${card.email}
NOTE:${card.notes}
END:VCARD`;

    const qr = qrcode(0, 'L');
    qr.addData(vcard);
    qr.make();
    
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = qr.createImgTag(4);
    document.getElementById('displaySection').style.display = 'block';
    document.getElementById('formSection').style.display = 'none';
}

// Add contact card button handler
document.getElementById('addContactCard').addEventListener('click', function() {
    const name = prompt('Enter contact name:');
    if (name) {
        addContactCard(name);
    }
});

// Check for saved data when page loads
checkSavedData();
updateContactCardsList();

// Profile selection change handler
document.getElementById('profileSelect').addEventListener('change', function() {
    // Ensure data is saved before generating QR code
    setTimeout(() => {
        checkSavedData();
    }, 100);
});

// Edit profile name handler
document.getElementById('editProfileNameButton').addEventListener('click', function() {
    const currentProfile = document.getElementById('profileSelect').value;
    const newName = prompt('Enter new name for profile:', currentProfile);
    
    if (newName && newName !== currentProfile) {
        const profiles = JSON.parse(localStorage.getItem('profiles'));
        
        if (profiles[newName]) {
            alert('A profile with that name already exists!');
            return;
        }
        
        // Copy profile data to new name
        profiles[newName] = profiles[currentProfile];
        // Delete old profile
        delete profiles[currentProfile];
        localStorage.setItem('profiles', JSON.stringify(profiles));
        
        // Update dropdown
        const select = document.getElementById('profileSelect');
        const option = select.querySelector(`option[value="${currentProfile}"]`);
        option.value = newName;
        option.textContent = newName;
        select.value = newName;
        
        checkSavedData();
    }
});

// Add new profile handler
document.getElementById('addProfileButton').addEventListener('click', function() {
    const profileName = prompt('Enter new profile name:');
    if (profileName) {
        const profiles = JSON.parse(localStorage.getItem('profiles'));
        if (!profiles[profileName]) {
            profiles[profileName] = { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0' };
            localStorage.setItem('profiles', JSON.stringify(profiles));
            
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            document.getElementById('profileSelect').appendChild(option);
            document.getElementById('profileSelect').value = profileName;
            checkSavedData();
        } else {
            alert('Profile already exists!');
        }
    }
});

// Helper function to adjust color brightness
function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

document.getElementById('vcardForm').addEventListener('submit', debounce(async function(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;
    submitButton.classList.add('processing');
    submitButton.textContent = 'Saving...';
    
    try {
        const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const linkedin = document.getElementById('linkedin').value;
    const color = document.getElementById('profileColor').value;
    
    const profiles = JSON.parse(localStorage.getItem('profiles'));
    const currentProfile = document.getElementById('profileSelect').value;
    
    profiles[currentProfile] = { name, email, phone, linkedin, color };
    localStorage.setItem('profiles', JSON.stringify(profiles));

    // Update manifest background color
    const manifestContent = {
        name: "Cardkick",
        short_name: "Cardkick", 
        start_url: "https://polvi.github.io/cardkick2/",
        display: "standalone",
        background_color: color,
        theme_color: color,
        icons: [
            {
                src: "icon-192.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: "icon-512.png", 
                sizes: "512x512",
                type: "image/png"
            }
        ]
    };
    
    const manifestBlob = new Blob([JSON.stringify(manifestContent, null, 2)], {type: 'application/json'});
    const manifestURL = URL.createObjectURL(manifestBlob);
    const existingManifest = document.querySelector('link[rel="manifest"]');
    if (existingManifest) {
        existingManifest.href = manifestURL;
    } else {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestURL;
        document.head.appendChild(manifestLink);
    }
    
    // Hide SEO content after saving data
    const seoContent = document.getElementById('seoContent');
    if (seoContent && seoContent.style.display !== 'none') {
        seoContent.style.opacity = '0';
        setTimeout(() => {
            seoContent.style.display = 'none';
        }, 300);
    }
    
        checkSavedData();
    } catch (error) {
        console.error('Form submission error:', error);
        if (typeof Sentry !== 'undefined') {
            Sentry.captureException(error);
        }
    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('processing');
        submitButton.textContent = 'Save and Generate QR Code';
    }
}, 500));
