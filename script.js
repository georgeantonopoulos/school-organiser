import { database } from './firebase-config.js';
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

const AUTHORIZED_EMAIL = 'elpielpi@gmail.com';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
let currentDay = new Date().getDay() - 1;
if (currentDay === -1) currentDay = 6;

let items = {
    christopher: {},
    maya: {}
};

function authenticate() {
    console.log("Authenticate function called");
    const email = document.getElementById('email').value;
    console.log("Entered email:", email);
    if (email === AUTHORIZED_EMAIL) {
        console.log("Email authorized");
        document.getElementById('auth').style.display = 'none';
        document.getElementById('planner').style.display = 'block';
        initializePlanner();
    } else {
        console.log("Unauthorized email");
        alert('Unauthorized email. Please try again.');
    }
}

function initializePlanner() {
    const daysContainer = document.getElementById('days');
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
    renderItems();
}

function addItem(child) {
    const input = document.querySelector(`#${child} input[type="text"]`);
    const item = input.value.trim();
    if (item) {
        if (!items[child].items) {
            items[child].items = [];
        }
        items[child].items.push({ name: item, checked: false });
        input.value = '';
        saveItems();
        renderItems();
    }
}

function toggleItem(child, index) {
    items[child].items[index].checked = !items[child].items[index].checked;
    saveItems();
    renderItems();
}

function removeItem(child, index) {
    items[child].items.splice(index, 1);
    saveItems();
    renderItems();
}

function renderItems() {
    ['christopher', 'maya'].forEach(child => {
        const container = document.querySelector(`#${child} .items`);
        container.innerHTML = '';
        const childItems = items[child].items || [];
        childItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = `item ${item.checked ? 'selected' : ''}`;
            itemElement.draggable = true;
            itemElement.setAttribute('data-index', index);
            itemElement.setAttribute('data-child', child);
            itemElement.innerHTML = `
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem('${child}', ${index})">
                <span>${item.name}</span>
                <button onclick="removeItem('${child}', ${index})">Remove</button>
            `;
            container.appendChild(itemElement);
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
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-index'));
    e.dataTransfer.setData('text/child', e.target.getAttribute('data-child'));
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const draggedChild = e.dataTransfer.getData('text/child');
    const targetElement = e.target.closest('.item');
    
    if (targetElement) {
        const targetIndex = parseInt(targetElement.getAttribute('data-index'));
        const targetChild = targetElement.getAttribute('data-child');
        
        if (draggedChild === targetChild && draggedIndex !== targetIndex) {
            const childItems = items[draggedChild].items;
            const [removed] = childItems.splice(draggedIndex, 1);
            childItems.splice(targetIndex, 0, removed);
            saveItems();
            renderItems();
        }
    }
}

function saveItems() {
    firebase.database().ref('items').set(items)
        .then(() => {
            console.log("Data saved successfully.");
        })
        .catch((error) => {
            console.error("Error saving data: ", error);
        });
}

function loadItems() {
    firebase.database().ref('items').on('value', (snapshot) => {
        if (snapshot.exists()) {
            items = snapshot.val();
            renderItems();
            enableDragAndDrop();
        } else {
            console.log("No data available");
        }
    }, (error) => {
        console.error("Error loading data: ", error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    document.getElementById('auth').style.display = 'block';
    document.getElementById('planner').style.display = 'none';
    
    const loginButton = document.querySelector('#auth button');
    console.log("Login button:", loginButton);
    
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            console.log("Login button clicked");
            e.preventDefault();
            authenticate();
        });
    } else {
        console.error("Login button not found");
    }

    // Add event listeners for add item buttons
    ['christopher', 'maya'].forEach(child => {
        const addButton = document.querySelector(`#${child} button`);
        if (addButton) {
            addButton.addEventListener('click', () => addItem(child));
        }
    });
});

// Expose functions to global scope for HTML onclick attributes
window.addItem = addItem;
window.toggleItem = toggleItem;
window.removeItem = removeItem;