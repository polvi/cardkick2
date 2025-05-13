if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('ServiceWorker registered');
            return registration.update();
        })
        .then(() => {
            console.log('ServiceWorker updated');
        })
        .catch(err => {
            console.error('ServiceWorker error:', err);
            if (typeof Sentry !== 'undefined') {
                Sentry.captureException(err);
            }
        });
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
        profiles.personal = { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0', photo: '' };
        profiles.business = { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0', photo: '' };
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
    const profileData = profiles[currentProfile] || { name: '', email: '', phone: '', linkedin: '', color: '#f0f0f0', photo: '' };
    
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

        // Handle photo display
        const photoDisplay = document.getElementById('photoDisplay');
        const displayPhoto = document.getElementById('displayPhoto');
        if (photoDisplay && displayPhoto && profileData.photo) {
            displayPhoto.src = profileData.photo;
            photoDisplay.style.display = 'block';
        } else if (photoDisplay) {
            photoDisplay.style.display = 'none';
        }
        // Generate QR code with proper error handling
        generateQRCode(profileData).catch(error => {
            console.error('Failed to generate QR code:', error);
            if (typeof Sentry !== 'undefined') {
                Sentry.captureException(error);
            }
        });
    } else {
        document.getElementById('formSection').style.display = 'block';
        document.getElementById('displaySection').style.display = 'none';
    }
}

function generateQRCode(data, retryCount = 0) {
    const qrcodeElement = document.getElementById('qrcode');
    qrcodeElement.innerHTML = '<p>Generating QR code...</p>';
    
    return new Promise((resolve, reject) => {
        function attemptGeneration() {
            try {
                if (typeof qrcode === 'undefined') {
                    if (!navigator.onLine) {
                        throw new Error('You are offline. Please check your internet connection.');
                    }
                    if (retryCount < 10) {
                        console.log(`QR code library not loaded, retrying... (${retryCount + 1}/10)`);
                        setTimeout(() => {
                            generateQRCode(data, retryCount + 1).then(resolve).catch(reject);
                        }, 500);
                        return;
                    }
                    throw new Error('QR code library failed to load after multiple attempts');
                }

                // Validate required data
                if (!data || !data.name || !data.phone || !data.email) {
                    throw new Error('Please fill in all required fields (name, phone, email)');
                }

                const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${data.name}
TEL:${data.phone}
EMAIL:${data.email}${data.linkedin ? `\nURL:${data.linkedin}` : ''}
END:VCARD`;
    
                const qr = qrcode(0, 'L');
                qr.addData(vcard);
                qr.make();
                qrcodeElement.innerHTML = qr.createImgTag(4);
                resolve();
            } catch (error) {
                console.error('QR code generation failed:', error);
                qrcodeElement.innerHTML = `<p style="color: red;">Error: ${error.message}</p>
                    <button onclick="checkSavedData()" style="margin-top: 10px;">Try Again</button>`;
                reject(error);
                if (typeof Sentry !== 'undefined') {
                    Sentry.captureException(error);
                }
            }
        }
        
        attemptGeneration();
    });
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
    
    // Handle photo preview
    const photoPreview = document.getElementById('photoPreview');
    const photoPreviewImage = document.getElementById('photoPreviewImage');
    if (profileData.photo) {
        photoPreviewImage.src = profileData.photo;
        photoPreview.style.display = 'block';
    } else {
        photoPreview.style.display = 'none';
    }
    document.getElementById('formSection').style.display = 'block';
    document.getElementById('displaySection').style.display = 'none';
});

// Check for saved data when page loads
checkSavedData();

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
    const photoInput = document.getElementById('photo');
    
    const profiles = JSON.parse(localStorage.getItem('profiles'));
    const currentProfile = document.getElementById('profileSelect').value;
    
    // Keep existing photo if no new one is selected
    const existingPhoto = profiles[currentProfile]?.photo || '';
    profiles[currentProfile] = { 
        name, 
        email, 
        phone, 
        linkedin, 
        color,
        photo: existingPhoto 
    };
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
    
    try {
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
        // Clean up the blob URL when done
        setTimeout(() => URL.revokeObjectURL(manifestURL), 1000);
    } catch (error) {
        console.error('Failed to update manifest:', error);
        if (typeof Sentry !== 'undefined') {
            Sentry.captureException(error);
        }
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

// Photo handling
const photoInput = document.getElementById('photo');
const photoPreview = document.getElementById('photoPreview');
const photoPreviewImage = document.getElementById('photoPreviewImage');
const removePhotoButton = document.getElementById('removePhoto');

if (photoInput && photoPreview && photoPreviewImage) {
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500000) { // 500KB limit
            alert('Photo must be less than 500KB');
            this.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                photoPreviewImage.src = e.target.result;
                photoPreview.style.display = 'block';
                
                // Save to profile
                const profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
                const currentProfile = document.getElementById('profileSelect')?.value || 'personal';
                if (!profiles[currentProfile]) {
                    profiles[currentProfile] = {};
                }
                profiles[currentProfile].photo = e.target.result;
                localStorage.setItem('profiles', JSON.stringify(profiles));
            } catch (error) {
                console.error('Error handling photo:', error);
                if (typeof Sentry !== 'undefined') {
                    Sentry.captureException(error);
                }
            }
        };
        reader.readAsDataURL(file);
    });
}

if (removePhotoButton && photoPreview && photoInput) {
    removePhotoButton.addEventListener('click', function() {
        try {
            photoInput.value = '';
            photoPreview.style.display = 'none';
            
            const profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
            const currentProfile = document.getElementById('profileSelect')?.value || 'personal';
            if (profiles[currentProfile]) {
                profiles[currentProfile].photo = '';
                localStorage.setItem('profiles', JSON.stringify(profiles));
            }
        } catch (error) {
            console.error('Error removing photo:', error);
            if (typeof Sentry !== 'undefined') {
                Sentry.captureException(error);
            }
        }
    });
}
