if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('ServiceWorker registered'))
        .catch(err => console.log('ServiceWorker registration failed: ', err));
}

// Initialize profiles if not exists
function initializeProfiles() {
    const profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
    if (Object.keys(profiles).length === 0) {
        profiles.personal = { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0' };
        profiles.business = { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0' };
        localStorage.setItem('profiles', JSON.stringify(profiles));
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
        document.getElementById('displayLinkedin').textContent = profileData.linkedin || 'Not provided';
        generateQRCode(profileData);
    } else {
        document.getElementById('formSection').style.display = 'block';
        document.getElementById('displaySection').style.display = 'none';
    }
}

function generateQRCode(data) {
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

// Check for saved data when page loads
checkSavedData();

// Profile selection change handler
document.getElementById('profileSelect').addEventListener('change', function() {
    checkSavedData();
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

document.getElementById('vcardForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const linkedin = document.getElementById('linkedin').value;
    const color = document.getElementById('profileColor').value;
    
    const profiles = JSON.parse(localStorage.getItem('profiles'));
    const currentProfile = document.getElementById('profileSelect').value;
    
    profiles[currentProfile] = { name, email, phone, linkedin, color };
    localStorage.setItem('profiles', JSON.stringify(profiles));
    checkSavedData();
});
