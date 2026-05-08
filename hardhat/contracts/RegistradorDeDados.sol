// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RegistradorDeDados {
    event RegistroRealizado(address indexed destino, string dadosJson);

    // Removemos o 'payable' pois você disse que não quer enviar valor
    function enviarComDados(address _destino, string memory _json) public {
        
        // Se o objetivo é apenas registrar o dado no histórico da rede
        // atrelado a um endereço, o EMIT é a forma correta e mais barata.
        emit RegistroRealizado(_destino, _json);

        // Se você REALMENTE quer que o JSON apareça no payload da transação 
        // de 'quem recebe', usamos bytes(_json) para converter a string de forma bruta.
        (bool sucesso, ) = _destino.call(bytes(_json));
        
        // Nota: Se _destino for uma carteira de pessoa (Metamask), 
        // o sucesso será sempre 'true'. Se for um contrato sem função fallback, será 'false'.
        require(sucesso, "O destino rejeitou os dados");
    }
}
