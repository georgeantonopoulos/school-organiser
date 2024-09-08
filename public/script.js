let db;
let currentUser;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
let currentDay = new Date().getDay() - 1;
if (currentDay === -1) currentDay = 6;

document.addEventListener('DOMContentLoaded', () => {
    const app = firebase.app();
    db = firebase.firestore();
    
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            document.getElementById('planner').style.display = 'block';
            initializePlanner();
        } else {
            document.getElementById('planner').style.display = 'none';
        }
    });
});

function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch((error) => {
        console.error('Login error:', error);
    });
}

function initializePlanner() {
    const daysContainer = document.getElementById('days');
    daysContainer.innerHTML = '';
    DAYS.forEach((day, index) => {
        const dayElement = document.createElement('div');
        dayElement.className = `day ${index === currentDay ? 'active' : ''}`;
        dayElement.textContent = day;
        dayElement.onclick = () => setActiveDay(index);
        daysContainer.appendChild(dayElement);
    });
    loadItems();
}

function setActiveDay(index) {
    document.querySelectorAll('.day').forEach((day, i) => {
        day.classList.toggle('active', i === index);
    });
    currentDay = index;
    loadItems();
}

function addItem(child) {
    const input = document.querySelector(`#${child} input[type="text"]`);
    const item = input.value.trim();
    if (item) {
        db.collection('items').add({
            text: item,
            selected: false,
            child: child,
            day: DAYS[currentDay],
            userId: currentUser.uid
        }).then(() => {
            input.value = '';
        }).catch((error) => {
            console.error('Error adding item:', error);
        });
    }
}

function toggleItem(id, selected) {
    db.collection('items').doc(id).update({
        selected: selected
    }).catch((error) => {
        console.error('Error updating item:', error);
    });
}

function removeItem(id) {
    db.collection('items').doc(id).delete().catch((error) => {
        console.error('Error removing item:', error);
    });
}

function loadItems() {
    ['christopher', 'maya'].forEach(child => {
        const container = document.querySelector(`#${child} .items`);
        
        db.collection('items')
            .where('userId', '==', currentUser.uid)
            .where('child', '==', child)
            .where('day', '==', DAYS[currentDay])
            .onSnapshot((snapshot) => {
                container.innerHTML = '';
                snapshot.forEach((doc) => {
                    const item = doc.data();
                    const itemElement = document.createElement('div');
                    itemElement.className = `item ${item.selected ? 'selected' : ''}`;
                    itemElement.draggable = true;
                    itemElement.setAttribute('data-id', doc.id);
                    itemElement.innerHTML = `
                        <input type="checkbox" ${item.selected ? 'checked' : ''} onchange="toggleItem('${doc.id}', this.checked)">
                        <span>${item.text}</span>
                        <button onclick="removeItem('${doc.id}')">Remove</button>
                    `;
                    container.appendChild(itemElement);
                });
                enableDragAndDrop();
            }, (error) => {
                console.error('Error loading items:', error);
            });
    });
}

function enableDragAndDrop() {
    const containers = document.querySelectorAll('.items');
    containers.forEach(container => {
        container.addEventListener('dragstart', dragStart);
        container.addEventListener('dragover', dragOver);
        container.addEventListener('drop', drop);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const targetElement = e.target.closest('.item');
    
    if (targetElement) {
        const targetId = targetElement.getAttribute('data-id');
        
        if (draggedId !== targetId) {
            // Implement reordering logic here if needed
            // For simplicity, we're not implementing reordering in this example
            console.log('Reordering not implemented in this example');
        }
    }
}

// Remove unused functions: authenticate, saveItems, loadItems (local storage version)

