document.addEventListener("DOMContentLoaded", () => {
    const campoValor = document.getElementById("valor");
    const erroMensagem = document.getElementById("erro-valor");
    const botaoEnviar = document.getElementById("btnEnviar");
    const container = document.querySelector(".container");
    const valorGroup = document.querySelector(".valor-group");

    function validarValor() {
        let valorTexto = campoValor.value.replace(/[^\d,\.]/g, "").replace(",", ".");
        let valor = parseFloat(valorTexto);

        if (!isNaN(valor) && valor >= 100) {
            botaoEnviar.disabled = false;
            erroMensagem.style.display = "none";
            valorGroup.classList.remove("erro");
            container.classList.remove("erro");
        } else {
            botaoEnviar.disabled = true;
            erroMensagem.style.display = "block";
            valorGroup.classList.add("erro");
            container.classList.add("erro");
        }
    }

    botaoEnviar.disabled = true; // começa desabilitado
    campoValor.addEventListener("input", validarValor);
});
