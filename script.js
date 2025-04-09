/*EMAIL*/
document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();

    emailjs.sendForm('service_2ok9iti', 'template_jp05jnb', this)
        .then(function() {
            alert('Mensagem enviada com sucesso!');
        }, function(error) {
            alert('Falha ao enviar a mensagem: ' + JSON.stringify(error));
        });
});
/*FIM EMAIL*/