# Painel de compras — atualização de busca e lead time

## Aplicação no diretório do site

Substitua `app.js`, `style.css` e `index.html` pelos arquivos deste pacote. Mantenha a pasta `data/` e a imagem `logo-linshalm.png` que já estão no repositório. O `index.html` já altera a versão dos arquivos para atualizar o cache do navegador. Não é preciso alterar os CSVs existentes para usar esta versão.

## Consulta no Dashboard Geral

- **Código do item** e **código do fornecedor**: correspondência exata com os campos `Produto` e `Fornecedor` da exportação. O campo de fornecedor indica o código do *cadastro do fornecedor*, não o part number do item.
- **Descrição, PN ou TAUS**: busca por palavras na descrição e, quando disponíveis no CSV, na observação e na referência do fornecedor. A exportação atual não possui colunas próprias para PN, TAUS, observação ou referência: só dá para encontrá-los quando constarem na descrição. Para habilitar a busca após a migração para a observação, inclua essas colunas na exportação do `geral.csv`.
- **Fornecedores**: pesquise por nome/código, marque vários, remova individualmente pelos marcadores ou limpe a seleção. Filtros podem ser combinados.
- **Tabela**: código do fornecedor visível e páginas de 100 linhas, inclusive além da antiga limitação de 1.500.

## Como interpretar o lead time

- **Previsto ponderado**: dias corridos entre `Data Cadastro` e `Previsão Entrega Inicial`, ponderados pela `Quantidade Compra` nas linhas filtradas. É o prazo previsto no pedido, não o prazo homologado cadastrado.
- **Realizado ponderado**: dias corridos entre `Data Cadastro` e a **última** data em `Data Recebimentos` para linhas totalmente atendidas, também ponderados pela quantidade comprada. Linhas parciais não entram na média realizada.
- Linhas sem datas válidas, com prazo negativo ou quantidade não positiva não entram na média. O cartão mostra `—` quando não há amostra válida. O detalhamento por fornecedor aparece quando os filtros deixam exatamente um código de produto.
- Selecione **Todos os anos** para ampliar o histórico. Confira a amostra, o fornecedor homologado e o prazo preferencial com Compras antes de copiar uma referência para o cadastro.

**Limite dos dados:** o CSV de 2026 enviado tem 10.974 linhas, mas não tem número do item dentro do pedido; ele contém 195 linhas integralmente repetidas. Sem o número do item não é possível confirmar se essas linhas são duplicações ou itens legítimos, então este pacote preserva a interpretação já usada pelo painel. A exportação do número do item e dos campos de observação/referência melhorará a precisão da consulta.
