# Conversor de Partitura para MIDI

Um conversor inteligente que transforma imagens de partituras musicais em arquivos MIDI de alta precisão.

## Funcionalidades

✨ **Reconhecimento Automático de Partituras**
- Analisa imagens PNG, JPEG, JPG de partituras musicais
- Detecta notas nas 88 teclas do piano
- Reconhece duração das notas (semibreve, mínima, semínima, colcheia, etc.)
- Detecta pausas e compassos

🎵 **Geração de MIDI Precisa**
- Converte notas reconhecidas em arquivo MIDI
- Mantém exatidão das notas e durações
- Validação dupla de notas antes da geração
- Suporta andamentos e tempos personalizados

🔍 **Verificação de Qualidade**
- Analisa a partitura duas vezes para garantir precisão
- Relatório detalhado de notas detectadas
- Preview das notas antes de gerar MIDI

## Como Usar

1. Abra o site
2. Clique em "Selecionar Partitura"
3. Escolha uma imagem PNG, JPEG ou JPG
4. Clique em "Analisar Partitura"
5. Revise as notas detectadas
6. Clique em "Gerar MIDI"
7. Baixe o arquivo MIDI gerado

## Requisitos

- Navegador moderno com suporte a Canvas e FileReader
- Imagem clara da partitura musical (resolução mínima 800x600)

## Tecnologias

- HTML5 / CSS3 / JavaScript Vanilla
- Biblioteca: Tone.js (para síntese de áudio)
- OpenCV.js (para análise de imagem)
- jsmidgen (para geração de MIDI)

## Estrutura do Projeto
