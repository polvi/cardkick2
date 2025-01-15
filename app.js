if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('ServiceWorker registered'))
        .catch(err => console.log('ServiceWorker registration failed: ', err));
}

document.getElementById('vcardForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    // Generate vCard format
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${phone}
EMAIL:${email}
END:VCARD`;
    
    // Generate QR code
    const qr = qrcode(0, 'L');
    qr.addData(vcard);
    qr.make();
    
    // Display QR code
    document.getElementById('qrcode').innerHTML = qr.createImgTag(4);
});
