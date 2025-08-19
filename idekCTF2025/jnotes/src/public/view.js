function showNote(note) {
	titleElement = $("#noteTitle");
	contentElement = $("#noteContent");
	titleElement.text(note["noteTitle"]);
	contentElement.html(note["noteContent"]);
};