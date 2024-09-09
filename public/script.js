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
    loadChildren();
    clearCheckedItemsFromOtherDays(); // Add this line
}

function clearCheckedItemsFromOtherDays() {
    const today = DAYS[currentDay];
    db.collection('items')
        .where('userId', '==', currentUser.uid)
        .where('selected', '==', true)
        .get()
        .then((snapshot) => {
            const batch = db.batch();
            snapshot.forEach((doc) => {
                const item = doc.data();
                if (item.day !== today) {
                    batch.update(doc.ref, { selected: false });
                }
            });
            return batch.commit();
        })
        .then(() => {
            console.log('Cleared checked items from other days');
            loadItems(); // Reload items to reflect the changes
        })
        .catch((error) => {
            console.error('Error clearing checked items:', error);
        });
}

function loadChildren() {
    console.log('Loading children...');
    db.collection('items')
        .where('userId', '==', currentUser.uid)
        .get()
        .then((snapshot) => {
            const listsContainer = document.getElementById('lists');
            listsContainer.innerHTML = '';
            const children = new Set();
            snapshot.forEach((doc) => {
                const item = doc.data();
                children.add(item.child);
            });
            console.log('Found children:', Array.from(children));
            children.forEach(childName => {
                addChildToDOM(childName);
            });
            loadItems();
        })
        .catch((error) => {
            console.error('Error loading children:', error);
        });
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
            loadItems(); // Reload items after adding a new one
        }).catch((error) => {
            console.error('Error adding item:', error);
        });
    }
}

function toggleItem(id, selected) {
    db.collection('items').doc(id).get().then((doc) => {
        if (doc.exists) {
            return db.collection('items').doc(id).update({
                selected: selected
            });
        } else {
            console.log('No such document!');
            return Promise.reject('Document does not exist');
        }
    }).then(() => {
        // Update the UI immediately
        const itemElement = document.querySelector(`[data-id="${id}"]`);
        if (itemElement) {
            itemElement.classList.toggle('selected', selected);
        }
    }).catch((error) => {
        console.error('Error updating item:', error);
    });
}

function removeItem(id) {
    db.collection('items').doc(id).get().then((doc) => {
        if (doc.exists) {
            return db.collection('items').doc(id).delete();
        } else {
            console.log('No such document!');
            return Promise.reject('Document does not exist');
        }
    }).then(() => {
        loadItems(); // Reload items after removing one
    }).catch((error) => {
        console.error('Error removing item:', error);
    });
}

function loadItems() {
    console.log('Loading items for day:', DAYS[currentDay]);
    db.collection('items')
        .where('userId', '==', currentUser.uid)
        .where('day', '==', DAYS[currentDay])
        .get()
        .then((snapshot) => {
            const itemsByChild = {};
            snapshot.forEach((doc) => {
                const item = doc.data();
                if (!itemsByChild[item.child]) {
                    itemsByChild[item.child] = [];
                }
                itemsByChild[item.child].push({ id: doc.id, ...item });
            });
            
            console.log('Items by child:', itemsByChild);
            
            // Update all children's items, even if empty
            document.querySelectorAll('#lists > div').forEach(childElement => {
                const childId = childElement.id;
                const container = childElement.querySelector('.items');
                container.innerHTML = '';
                if (itemsByChild[childId]) {
                    itemsByChild[childId].forEach(item => {
                        const itemElement = createItemElement(item);
                        container.appendChild(itemElement);
                    });
                }
            });
            
            enableDragAndDrop();
        })
        .catch((error) => {
            console.error('Error loading items:', error);
        });
}

function createItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = `item ${item.selected ? 'selected' : ''}`;
    itemElement.draggable = true;
    itemElement.setAttribute('data-id', item.id);
    itemElement.innerHTML = `
        <input type="checkbox" ${item.selected ? 'checked' : ''} onchange="toggleItem('${item.id}', this.checked)">
        <span>${item.text}</span>
        <button onclick="removeItem('${item.id}')">Remove</button>
    `;
    return itemElement;
}

function addChild() {
    const newChildName = document.getElementById('newChildName').value.trim();
    if (newChildName) {
        const childId = newChildName.toLowerCase().replace(/\s+/g, '-');
        // We don't need to add anything to the database here
        // Just add the child to the DOM
        addChildToDOM(childId);
        document.getElementById('newChildName').value = '';
    }
}

function addChildToDOM(childId) {
    console.log('Adding child to DOM:', childId);
    const listsContainer = document.getElementById('lists');
    if (!document.getElementById(childId)) {
        const childElement = document.createElement('div');
        childElement.id = childId;
        childElement.innerHTML = `
            <div class="child-header">
                <h2>${childId.replace(/-/g, ' ')} <button class="delete-child" onclick="confirmDeleteChild('${childId}')">&times;</button></h2>
            </div>
            <div class="items"></div>
            <div class="input-group">
              <input type="text" placeholder="Add new item">
              <button onclick="addItem('${childId}')">Add</button>
            </div>
        `;
        listsContainer.appendChild(childElement);
    }
}

function confirmDeleteChild(childId) {
    if (confirm(`Are you sure you want to delete ${childId.replace(/-/g, ' ')} and all their items? This action cannot be undone.`)) {
        deleteChild(childId);
    }
}

function deleteChild(childId) {
    // Remove child from DOM
    const childElement = document.getElementById(childId);
    if (childElement) {
        childElement.remove();
    }

    // Delete all items for this child from the database
    db.collection('items')
        .where('userId', '==', currentUser.uid)
        .where('child', '==', childId)
        .get()
        .then((snapshot) => {
            const batch = db.batch();
            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(() => {
            console.log(`Deleted all items for child: ${childId}`);
        })
        .catch((error) => {
            console.error('Error deleting child items:', error);
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

