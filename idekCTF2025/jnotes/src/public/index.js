function getDataAsJSON($form) {
	const unindexed_array = $form.serializeArray();
	const indexed_array = {};

	$.map(unindexed_array, function (n, i) {
		indexed_array[n['name']] = n['value'];
	});

	return JSON.stringify(indexed_array);
}

$('#noteForm').submit(function (event) {
	event.preventDefault();

	const jsonData = getDataAsJSON($(this));

	$.ajax({
		type: 'POST',
		url: '/api/post',
		contentType: 'application/json',
		dataType: 'json',
		data: jsonData,
		success: function (response) {
			$("#message").html(`<a href="/note/${response['id']}">view your note</a>`);
		},
		error: function (response, status, error) {
			const message = response.responseJSON["message"];
			$("#message").text(message);
		}
	});
});
