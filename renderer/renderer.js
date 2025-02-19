// document.getElementById('menu-screen1').addEventListener('click', () => {
//     loadScreen('./src/views/screen1.html');
// });

// document.getElementById('menu-screen2').addEventListener('click', () => {
//     loadScreen('./src/views/screen2.html');
// });
document.getElementById('menu').addEventListener('click', () => {
    window.location.href = 'index.html';
 });
 
 
 function loadScreen(screen) {
     fetch(screen)
         .then(response => response.text())
         .then(data => {
             document.querySelector('.content').innerHTML = data;
         })
         .catch(error => console.error('Error loading screen:', error));
 }