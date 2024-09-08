const AUTHORIZED_EMAIL = 'elpielpi@gmail.com';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
let currentDay = new Date().getDay() - 1;
if (currentDay === -1) currentDay = 6;

let items = {
    christopher: {},
    maya: {}
};

function authenticate() {
    const email = document.getElementById('email').value;
    if (email === AUTHORIZED_EMAIL) {
        localStorage.setItem('authorizedEmail', email);
        document.getElementById('auth').style.display = 'none';
        document.getElementById('planner').style.display = 'block';
        initializePlanner();
    } else {
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
    renderItems();
    enableDragAndDrop();
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
        if (!items[child][DAYS[currentDay]]) {
            items[child][DAYS[currentDay]] = [];
        }
        items[child][DAYS[currentDay]].push({ text: item, selected: false });
        input.value = '';
        saveItems();
        renderItems();
    }
}

function toggleItem(child, index) {
    items[child][DAYS[currentDay]][index].selected = !items[child][DAYS[currentDay]][index].selected;
    saveItems();
    renderItems();
}

function removeItem(child, index) {
    items[child][DAYS[currentDay]].splice(index, 1);
    saveItems();
    renderItems();
}

function renderItems() {
    ['christopher', 'maya'].forEach(child => {
        const container = document.querySelector(`#${child} .items`);
        container.innerHTML = '';
        const dayItems = items[child][DAYS[currentDay]] || [];
        dayItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = `item ${item.selected ? 'selected' : ''}`;
            itemElement.draggable = true;
            itemElement.setAttribute('data-index', index);
            itemElement.setAttribute('data-child', child);
            itemElement.innerHTML = `
                <input type="checkbox" ${item.selected ? 'checked' : ''} onchange="toggleItem('${child}', ${index})">
                <span>${item.text}</span>
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
            const dayItems = items[draggedChild][DAYS[currentDay]];
            const [removed] = dayItems.splice(draggedIndex, 1);
            dayItems.splice(targetIndex, 0, removed);
            saveItems();
            renderItems();
        }
    }
}

function saveItems() {
    localStorage.setItem('schoolItems', JSON.stringify(items));
}

function loadItems() {
    const savedItems = localStorage.getItem('schoolItems');
    if (savedItems) {
        items = JSON.parse(savedItems);
    }
}

// Initialize the planner when the script loads
document.addEventListener('DOMContentLoaded', () => {
    const savedEmail = localStorage.getItem('authorizedEmail');
    if (savedEmail === AUTHORIZED_EMAIL) {
        document.getElementById('auth').style.display = 'none';
        document.getElementById('planner').style.display = 'block';
        initializePlanner();
    }
});