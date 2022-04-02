const mainEl = document.querySelector("main");
const searchEl = document.querySelector(".filter-notes__search");
const dropdownEl = document.querySelector(".filter-notes__dropdown");
const foldersEl = document.querySelector(".folders");
const addFolderEl = document.querySelector(".add-folder");
const deleteFolderEl = document.querySelector(".delete-folder");
const addNoteEl = document.querySelector(".add-note");
const recentNotesEl = document.querySelector(".recent-notes");

let filterMode = "byEdited";

if (window.localStorage.getItem("notes") === null) {
  window.localStorage.setItem("notes", "[]");
}

if (window.localStorage.getItem("folders") === null) {
  window.localStorage.setItem("folders", "[]");
}

const folders = JSON.parse(window.localStorage.getItem("folders"));
const notes = JSON.parse(window.localStorage.getItem("notes"));

const updateNotes = function () {
  window.localStorage.setItem("notes", JSON.stringify(notes));
};

function updateFolders() {
  window.localStorage.setItem("folders", JSON.stringify(folders));
}

function renderError(message) {
  const html = `
  <div class="error">
  <p class="error__message">${message}</p>
  </div>
  `;

  document.querySelector("body").insertAdjacentHTML("afterbegin", html);
}

function removeError() {
  const errorEl = document.querySelector(".error");
  if (errorEl) errorEl.remove();
}

function listenToDelete(noteEl) {
  noteEl.querySelector(".note__delete").addEventListener("click", () => {
    noteEl.remove();
    const note = notes.find((n) => Number(n.id) === noteEl.dataset.id);
    notes.splice(notes.indexOf(note), 1);
    updateNotes();
    let latestNotes = [...notes];
    latestNotes = latestNotes.reverse();
    renderNotes(latestNotes);
  });
}

function deleteFolder() {
  const submittedFolder = document.querySelector(
    ".modal--folder__dropdown"
  ).value;

  const folder = folders.find((f) => {
    return f.name === submittedFolder;
  });

  console.log(folder);

  if (folder === undefined) {
    console.log("err");
    renderError("This folder does not exist anymore");
  }

  folders.splice(folder, 1);
  notes
    .filter((note) => note.folder === folder.name)
    .forEach((note) => notes.splice(note, 1));
  updateNotes();
  updateFolders();
  let latestNotes = [...notes];
  latestNotes.reverse();
  renderNotes(latestNotes);
  renderAllFolders();
  if (folder) removeError();
}
deleteFolderEl.addEventListener("click", () => {
  if (folders.length === 0) renderError("You have no folders to delete");

  if (folders.length > 0) {
    const folderOptions = folders
      .map((folder) => {
        return `<option value="${folder.name}">${folder.name}</option>/>`;
      })
      .join("");

    const modalHTML = `
    <div class="modal--folder">
    <h2>Delete Folder</h2>
    <button class="modal--folder__close-button">x</button>
    <select class="modal--folder__dropdown">
    ${folderOptions}
    </select>
    <button class="modal--folder__submit-button">Submit</button>
    </div>
    </div>`;

    renderModal("folder", modalHTML, deleteFolder);
  }
});

function generateDateObject(currentTime) {
  return {
    day: currentTime.getDate(),
    hour: currentTime.getHours(),
    minutes: currentTime.getMinutes(),
    time: currentTime.getTime(),
  };
}

function displayFolderNotes(folderEl) {
  const folderName = folderEl.querySelector(".folder__name").textContent;
  const folderNotes = notes.filter((note) => {
    return note.folder === folderName;
  });

  const isOpen = folderEl.dataset.open === "true";

  if (!isOpen) {
    folderEl.dataset.open = "true";
    folderEl
      .querySelector(".folder__icon")
      .querySelector("use")
      .setAttribute("href", "icons.svg#icon-folder-open");

    if (folderNotes.length === 0) return;

    folderNotes.forEach((note) => {
      const HTML = `
      <div class="note-tab" data-note-id="${note.id}">
      <svg class="note-tab__icon">
        <use href="icons.svg#icon-file-text"></use>
      </svg>
      <span class="note-tab__name">${note.title}</span>
    </div>
      `;

      folderEl.insertAdjacentHTML("afterend", HTML);

      foldersEl
        .querySelector(`[data-note-id="${note.id}"`)
        .addEventListener("click", () => {
          renderNotes([note]);
        });
    });
  } else {
    folderEl.dataset.open = "false";
    folderEl
      .querySelector(".folder__icon")
      .querySelector("use")
      .setAttribute("href", "icons.svg#icon-folder");

    folderNotes.forEach((note) => {
      foldersEl.querySelector(`[data-note-id="${note.id}"]`).remove();
    });
  }
}

function renderAllFolders() {
  foldersEl.innerHTML = "";
  if (folders.length === 0) {
    foldersEl.innerHTML = "<p class='no-folders'>You have no folders</p>";
  }

  folders.forEach((folder) => {
    const folderTabHTML = `
        <div class="folder" data-folder-id="${folder.id}" data-open="false">
        <svg class="folder__icon">
          <use href="icons.svg#icon-folder"></use>
        </svg>
        <span class="folder__name">${folder.name}</span>
      </div>
        `;

    foldersEl.insertAdjacentHTML("beforeend", folderTabHTML);
    const folderEl = document.querySelector(`[data-folder-id="${folder.id}"]`);
    folderEl.addEventListener("click", () => {
      displayFolderNotes(folderEl);
    });
  });
}

function displayNoteDescription(note, noteEl) {
  if (noteEl.dataset.open === "false") {
    const dateStr = noteEl.querySelector(".note__last-edited").textContent;
    const html = `
    <h3 class="note__title">${note.title} - ${note.folder}</h3>
    <p class="note__last-edited">
 
     ${dateStr}</p>
    <textarea class="note__description">${note.text}</textarea>
    <button class="note__delete">
      <svg class="note__delete-icon">
        <use href="icons.svg#icon-bin"></use>
      </svg>
    </button>
    `;

    noteEl.dataset.open = "true";
    noteEl.innerHTML = html;

    const noteDescriptionEl = noteEl.querySelector(".note__description");

    noteDescriptionEl.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    noteDescriptionEl.addEventListener("keyup", () => {
      note.text = noteDescriptionEl.value;
      updateNotes();
      const currentTime = new Date();
      note.editDate = generateDateObject(currentTime);
      note.edited = true;

      const lastCreatedMinutes = Math.floor(
        (currentTime.getTime() -
          (note.edited ? note.editDate.time : note.date.time)) /
          3600000
      );
      const dateStr = getNoteDate(
        lastCreatedMinutes,
        currentTime.getTime(),
        note
      );
      noteEl.querySelector(".note__last-edited").textContent = `${
        note.edited ? "Edited" : "Created"
      } ${dateStr}`;
    });
  } else {
    noteEl.dataset.open = "false";
    noteEl.querySelector(".note__description").remove();
  }
}

function getNoteDate(lastCreatedMinutes, currentTime, note, getEdited = false) {
  let dateStr;
  const noteDate = note.edited && getEdited ? note.editDate : note.date;

  if (currentTime >= noteDate.time && currentTime - 3600000 <= noteDate.time) {
    let minutes;

    switch (lastCreatedMinutes) {
      case 0:
        minutes = "a few moments ago";
        break;

      case 1:
        minutes = `a minute ago`;
        break;

      default:
        minutes = `${Math.abs(lastCreatedMinutes)} minutes ago`;
        break;
    }

    dateStr = `${minutes}`;
  }

  if (
    currentTime >= noteDate.time &&
    currentTime - 86400000 <= noteDate.time &&
    currentTime - 3600000 >= noteDate.time
  ) {
    const hourNum = `${Math.floor(
      (currentTime - noteDate.time) / 3600000
    )} hours ago`;
    dateStr = hourNum === "1 hours ago" ? "an hour ago" : hourNum;
  }

  if (currentTime >= noteDate.time && currentTime - 86400000 >= noteDate.time) {
    console.log("day");
    dateStr = `${Math.floor(
      (currentTime - noteDate.time) / 86400000
    )} days ago`;

    if (dateStr === `1 days ago`) dateStr = "a day ago";
    dateStr = dateStr;
  }

  return dateStr;
}

function renderNotes(displayingNotes, displayLastCreated = false) {
  if (notes.length === 0) {
    const html = `<p class="no-notes">You have no notes</p>`;
    recentNotesEl.innerHTML = html;
  } else {
    recentNotesEl.innerHTML = "";
  }

  if (displayingNotes.length === 0 && notes.length > 0) {
    recentNotesEl.innerHTML =
      "<p class='no-notes'>No notes matching your query</p>";
  }
  const currentTime = new Date();
  displayingNotes.forEach((note) => {
    const isEdited = note.edited && !displayLastCreated ? true : false;
    const noteDate = isEdited ? note.editDate : note.date;

    const lastCreatedMinutes = Math.floor(
      (currentTime.getTime() - noteDate.time) / 60000
    );
    const dateStr = getNoteDate(
      lastCreatedMinutes,
      currentTime.getTime(),
      note,
      isEdited
    );
    const noteHTML = `
  <div class="note note-${note.id}" data-note-id="${
      note.id
    }" data-open="false" >
  <h3 class="note__title">${note.title} - ${note.folder}</h3>
  <p class="note__last-edited">${
    note.edited && !displayLastCreated ? "Edited" : "Created"
  } ${dateStr}</p>
  <button class="note__delete">
    <svg class="note__delete-icon">
      <use href="icons.svg#icon-bin"></use>
    </svg>
  </button>
</div>
  `;

    recentNotesEl.insertAdjacentHTML("beforeend", noteHTML);
    const noteEl = recentNotesEl.querySelector(`.note-${note.id}`);
    noteEl.addEventListener("click", () => {
      displayNoteDescription(note, noteEl);
    });

    listenToDelete(document.querySelector(`.note-${note.id}`));
  });
}
let latestNotes = [...notes].sort((a, b) => {
  if (a.edited && !b.edited) {
    return a.editDate.time - b.date.time;
  }

  if (a.edited && b.edited) {
    return a.editDate.time - b.editDate.time;
  }

  if (b.edited && !a.edited) {
    return a.date.time - b.editDate.time;
  }
});
latestNotes = latestNotes.reverse();

renderNotes(latestNotes);
renderAllFolders();

// CREATE NOTES / FOLDERS

function createNote() {
  const title = document.querySelector(".modal--note__title").value;
  const text = document.querySelector(".modal--note__text").value;
  const folder = document.querySelector(".modal--note__dropdown").value;
  const currentTime = new Date();

  const date = generateDateObject(currentTime);

  if (!title || !text) return;
  const id = notes.length > 0 ? notes[notes.length - 1].id + 1 : 0;

  const note = {
    title,
    text,
    folder,
    date,
    id,
  };

  notes.push(note);
  window.localStorage["notes"] = JSON.stringify(notes);
  let latestNotes = [...notes];
  latestNotes = latestNotes.reverse();
  renderNotes(latestNotes);
}

function createFolder() {
  const title = document.querySelector(".modal--folder__title").value;
  const id = folders.length > 0 ? folders[folders.length - 1].id + 1 : 0;
  const folder = {
    name: title,
    id,
  };
  folders.push(folder);
  window.localStorage["folders"] = JSON.stringify(folders);
  renderAllFolders();
  removeError();
}

// MODAL RENDERING

function renderModal(type, modalHTML, callBack) {
  // background is the black shading on everything but the modal when the modal is on the screen
  const backgroundHTML = "<div class='background'></div>";
  mainEl.insertAdjacentHTML("afterbegin", backgroundHTML);
  mainEl.insertAdjacentHTML("afterbegin", modalHTML);

  document
    .querySelector(`.modal--${type}__close-button`)
    .addEventListener("click", () => {
      removeError();
      mainEl.querySelector(".background").remove();
      mainEl.querySelector(`.modal--${type}`).remove();
    });

  document
    .querySelector(`.modal--${type}__submit-button`)
    .addEventListener("click", callBack);
}

addNoteEl.addEventListener("click", () => {
  if (folders.length === 0)
    renderError("Please add a folder before adding a note");

  if (folders.length > 0) {
    const folderOptions = folders
      .map((folder) => {
        return `<option value="${folder.name}">${folder.name}</option>/>`;
      })
      .join("");
    const modalHTML = `
        <div class="modal--note">
        <button class="modal--note__close-button">x</button>
        <input type="text" class="modal--note__title" placeholder="Title"/>
        <textarea class="modal--note__text" placeholder="description"></textarea>
        <div class="modal--note__field">
        <select class="modal--note__dropdown">
        ${folderOptions}
        </select>
        <button class="modal--note__submit-button">Submit</button>
        </div>
        </div>`;

    renderModal("note", modalHTML, createNote);
    removeError();
  }
});

addFolderEl.addEventListener("click", () => {
  const modalHTML = `
      <div class="modal--folder">
      <button class="modal--folder__close-button">x</button>
      <h2>Add Folder</h2>
      <input type="text" class="modal--folder__title" placeholder="Title"/>
      <button class="modal--folder__submit-button">Submit</button>
      </div>
      </div>`;

  renderModal("folder", modalHTML, createFolder);
  removeError();
});

// SEARCHING NOTES

searchEl.addEventListener("keyup", () => {
  const text = searchEl.value;
  const length = text.split("").length;
  const textAtTypedAmount = text.substring(0, length);
  const filteredNotes = notes.filter((note) => {
    const noteChars = note.title.substring(0, length);
    return noteChars === textAtTypedAmount;
  });

  renderNotes(filteredNotes);
  removeError();
});

dropdownEl.addEventListener("change", () => {
  const filter = dropdownEl.value;

  if (filter === "byCreated") {
    const filteredNotes = notes.sort((a, b) => {
      return b.date.time - a.date.time;
    });
    renderNotes(filteredNotes, true);
  }

  if (filter === "byEdit") {
    const filteredNotes = notes
      .filter((note) => note.edited)
      .sort((note, note2) => note2.editDate.time - note.editDate.time);
    const unEditedNotes = notes.filter((note) => note.edited === undefined);
    unEditedNotes.reverse();
    renderNotes(filteredNotes.concat(unEditedNotes));
  }

  if (filter === "regular") {
    window.location.reload();
  }
  filterMode = filter;
});
