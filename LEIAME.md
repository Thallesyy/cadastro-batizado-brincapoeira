# Cadastro do Batizado – Projeto Brincapoeira

Site de cadastro para atletas e familiares. Cada envio vai **na hora** para uma planilha Google, que você baixa como **Excel (.xlsx)** quando quiser.

```
site/
  index.html     ← o formulário (as configurações ficam no topo do <script>)
  logo.png       ← logo Capoeira Porto Bahia
  favicon.png
apps-script/
  Code.gs        ← o código que grava na planilha
```

A planilha recebe duas abas automaticamente:

| Aba | O que tem |
|---|---|
| **Atletas** | 1 linha por atleta: dados, participação (batizado/troca), corda atual, responsável, WhatsApp, familiares, total de pessoas, uso de imagem e observações |
| **Lista de Acesso** | 1 linha por **pessoa que vai entrar** (atleta + responsável + cada familiar), com documento e uma caixinha de **Presença** para marcar na portaria. É essa lista que você entrega à instituição. |

---

## Passo 1 – Criar a planilha e o script (uns 5 minutos)

1. Entre em <https://sheets.new> com a conta Google do projeto e dê um nome à planilha, por exemplo `Cadastro Batizado 2026`.
2. No menu, vá em **Extensões → Apps Script**.
3. Apague o que estiver escrito e **cole todo o conteúdo de `apps-script/Code.gs`**. Salve (ícone de disquete).
4. *(Opcional, mas recomendado)* No seletor de funções lá em cima, escolha **`testeManual`** e clique em **▶ Executar**.
   - O Google vai pedir autorização: clique em **Revisar permissões**, escolha sua conta, depois em **Avançado → Acessar (não seguro)** e por fim em **Permitir**. Esse aviso é normal, porque o script é seu e não foi publicado na loja do Google.
   - Volte à planilha: as abas *Atletas* e *Lista de Acesso* terão aparecido com uma linha de teste. Confira se o documento aparece como `0123456789` (com o zero na frente) e a data como `dd/mm/aaaa`.
   - Depois **apague as linhas de teste** (botão direito no número da linha → *Excluir linha*), deixando o cabeçalho. Só limpar o conteúdo não basta: as caixinhas de Presença continuariam lá e os próximos cadastros entrariam mais abaixo.

## Passo 2 – Publicar o script

1. No Apps Script, clique em **Implantar → Nova implantação**.
2. Na engrenagem ⚙ ao lado de “Selecione o tipo”, escolha **App da Web**.
3. Preencha assim:
   - **Executar como:** *Eu* (sua conta)
   - **Quem pode acessar:** **Qualquer pessoa** ⚠️ *(sem isso as famílias não conseguem enviar)*
4. Clique em **Implantar** e **copie a URL do app da Web** (ela termina com `/exec`).

> Se você mudar o `Code.gs` depois, vá em **Implantar → Gerenciar implantações → ✏️ Editar → Versão: Nova versão → Implantar**. Assim a URL continua a mesma.

## Passo 3 – Ligar o site à planilha

Abra `site/index.html` num editor de texto (o Bloco de Notas serve), procure `SCRIPT_URL` no começo do segundo `<script>` e cole a URL entre as aspas:

```js
SCRIPT_URL: "https://script.google.com/macros/s/AKfy...../exec",
```

No mesmo bloco `CONFIG` você também pode mudar:

| Opção | Para que serve |
|---|---|
| `DOCUMENTO` | `"obrigatorio"` (padrão: RG ou CPF de todos que entram), `"opcional"` ou `"nao"` (esconde o campo). Se mudar aqui, mude também `DOCUMENTO_OBRIGATORIO` no `Code.gs`. |
| `MAX_ACOMPANHANTES` | quantos familiares cada atleta pode cadastrar (padrão: 8) |
| `CORDAS` | sugestões de corda que aparecem enquanto a pessoa digita, ex.: `["Crua", "Crua e amarela", "Amarela"]`. Coloque as cordas do grupo. |
| `PARENTESCOS` | opções da lista de parentesco |
| `EVENTO` | data, horário e local que aparecem no topo |

## Passo 4 – Colocar o site no ar (grátis)

O jeito mais fácil é o **Netlify Drop**:

1. Abra <https://app.netlify.com/drop>.
2. **Arraste a pasta `site`** inteira para a página.
3. Pronto: você recebe um link, que pode trocar por um nome como `batizado-brincapoeira.netlify.app` em *Site settings → Change site name*.

Outras opções: GitHub Pages, Cloudflare Pages ou a hospedagem do site do grupo. É só subir os 3 arquivos da pasta `site`.

**Teste antes de divulgar:** faça um cadastro de teste pelo celular, confira se ele apareceu nas duas abas e exclua as linhas.

> Se a internet cair bem na hora do envio e a família tocar em enviar de novo, o cadastro **não duplica**: cada cadastro tem um protocolo único e o script ignora repetições.

---

## Baixar em Excel

Na planilha, vá em **Arquivo → Fazer download → Microsoft Excel (.xlsx)**. A planilha Google continua sendo atualizada a cada novo cadastro. Baixe de novo sempre que quiser a versão mais recente.

Dica para a portaria: abra a aba **Lista de Acesso** no celular (app Google Planilhas), use **Dados → Criar um filtro** para buscar o nome e marque a caixinha **Presença** quando a pessoa entrar.

## Privacidade

- A planilha tem dados de crianças. **Não compartilhe o link da planilha**, só o do site. O formulário apenas *envia* dados; abrir a URL `/exec` não mostra nenhum cadastro.
- Compartilhe a planilha só com quem organiza o evento.

## Problemas comuns

| Mensagem no site | O que fazer |
|---|---|
| “Este formulário ainda não está conectado à planilha” | Falta colar a `SCRIPT_URL` (Passo 3). |
| “A planilha não respondeu corretamente…” ou “Não conseguimos falar com a planilha…” | Se a internet está ok: a implantação não está com acesso para **Qualquer pessoa**, ou a URL copiada não é a que termina em `/exec`. |
| Mudei o `Code.gs` e nada mudou | Crie uma **nova versão** da implantação (veja a nota no Passo 2). |
