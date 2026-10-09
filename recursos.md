---
layout: default
title: Como participar
aba: recursos
permalink: /recursos/
---

# Encontre seu grupo

[Busque sua cidade no mapa]({{ '/' | relative_url }}), escolha um bairro ou escola e veja os grupos da sua célula.

## Já tem um grupo?

Abra sua célula, clique em **Enviar link do meu grupo** e cole o convite do WhatsApp ou Telegram.
O envio usa sua conta GitHub. Os admins revisam antes de publicar.

## Referência: mapas eleitorais por setor censitário

[Mapa de resultados por vizinhança](https://mapa.danielmariani.com.br/) — referência de interface e de explicação metodológica para uma futura visualização de dados eleitorais agregados.

Código de processamento publicado em [deltafolha/eleicoes-por-setores-censitarios](https://github.com/deltafolha/eleicoes-por-setores-censitarios).

### O que aproveitar na Colmeia

- Separar a visão geral da visão detalhada por setor, carregando dados geográficos em níveis de zoom.
- Usar tiles vetoriais ou arquivos estáticos particionados para evitar carregar toda a malha no celular.
- Exibir camadas independentes para setores e locais de votação.
- Destacar a célula selecionada e mostrar os locais públicos que sustentam uma estimativa.
- Manter a busca e o painel explicativo simples, com comportamento próprio para celular.
- Informar fontes, método, cobertura e limitações diretamente na interface.

### Limites para o uso

Esta referência não deve ser copiada como resultado eleitoral individual. A estimativa é territorial e agregada. Na Colmeia, qualquer uso futuro deve respeitar a Fase 2 da especificação, os códigos oficiais do TSE e a regra de não incluir dados pessoais.

{% include_relative diretorio.md %}
