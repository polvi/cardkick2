if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('ServiceWorker registered'))
        .catch(err => console.log('ServiceWorker registration failed: ', err));
}

// Check for saved data and show appropriate view
function checkSavedData() {
    const savedData = JSON.parse(localStorage.getItem('vcardData') || '{}');
    if (savedData.name) {
        document.getElementById('formSection').style.display = 'none';
        document.getElementById('displaySection').style.display = 'block';
        document.getElementById('displayName').textContent = savedData.name;
        document.getElementById('displayEmail').textContent = savedData.email;
        document.getElementById('displayPhone').textContent = savedData.phone;
        generateQRCode(savedData);
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
END:VCARD`;
    
    const qr = qrcode(0, 'L');
    qr.addData(vcard);
    qr.make();
    document.getElementById('qrcode').innerHTML = qr.createImgTag(4);
}

document.getElementById('editButton').addEventListener('click', function() {
    const savedData = JSON.parse(localStorage.getItem('vcardData') || '{}');
    document.getElementById('name').value = savedData.name || '';
    document.getElementById('email').value = savedData.email || '';
    document.getElementById('phone').value = savedData.phone || '';
    document.getElementById('formSection').style.display = 'block';
    document.getElementById('displaySection').style.display = 'none';
});

// Check for saved data when page loads
checkSavedData();

document.getElementById('vcardForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    const data = { name, email, phone };
    localStorage.setItem('vcardData', JSON.stringify(data));
    checkSavedData();
});
