/**
 * Cadastro Batizado · Projeto Brincapoeira (Capoeira Porto Bahia)
 * Recebe cada cadastro do site e grava na planilha Google (exportável para Excel).
 *
 * Abas criadas automaticamente:
 *   - "Atletas"          → 1 linha por atleta cadastrado
 *   - "Lista de Acesso"  → 1 linha por pessoa que vai entrar (atleta + responsável + familiares),
 *                          com coluna de presença (checkbox) para usar na portaria.
 *
 * Como instalar: veja o arquivo LEIAME.
 */

var ABA_ATLETAS = 'Atletas';
var ABA_ACESSO = 'Lista de Acesso';
var FUSO = 'America/Sao_Paulo';
var DATA_EVENTO = '2026-11-28';
var MAX_ACOMPANHANTES = 20;
var DOCUMENTO_OBRIGATORIO = true; // RG ou CPF de todos que entram

var CAB_ATLETAS = [
  'Data/hora', 'Protocolo', 'Atleta', 'Apelido', 'Nascimento', 'Idade no evento',
  'Documento atleta', 'Participação', 'Corda atual',
  'Responsável', 'Parentesco', 'Documento responsável', 'WhatsApp', 'E-mail',
  'Responsável vai?', 'Nº acompanhantes', 'Acompanhantes', 'Total de pessoas',
  'Uso de imagem', 'Observações'
];

var CAB_ACESSO = [
  'Data/hora', 'Protocolo', 'Nome', 'Tipo', 'Parentesco', 'Documento',
  'Criança?', 'Atleta vinculado', 'WhatsApp do responsável', 'Presença'
];

/* ------------------------------------------------------------------ */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return resposta({ ok: false, erro: 'Muitos envios ao mesmo tempo. Tente de novo em alguns segundos.' });
  }
  try {
    var dados = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var problema = validar(dados);
    if (problema) return resposta({ ok: false, erro: problema });

    var carimbo = Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy HH:mm:ss');
    var linhas = montarLinhas(dados, carimbo);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var abaAtletas = garantirAba(ss, ABA_ATLETAS, CAB_ATLETAS, '#E3262B');
    var abaAcesso = garantirAba(ss, ABA_ACESSO, CAB_ACESSO, '#0E5A33');

    if (protocoloJaExiste(abaAtletas, linhas.protocolo)) {
      return resposta({ ok: true, protocolo: linhas.protocolo, duplicado: true });
    }

    escrever(abaAtletas, [linhas.atleta]);
    var ini = escrever(abaAcesso, linhas.acesso);
    // coluna "Presença": caixinha para marcar na portaria
    abaAcesso.getRange(ini, CAB_ACESSO.length, linhas.acesso.length, 1).insertCheckboxes();

    return resposta({ ok: true, protocolo: linhas.protocolo });
  } catch (err) {
    return resposta({ ok: false, erro: 'Erro ao salvar: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/** Abrir a URL /exec no navegador mostra só isto (não expõe nenhum dado). */
function doGet() {
  return ContentService.createTextOutput('Cadastro Brincapoeira: online ✔');
}

/* ------------------------- regras puras ---------------------------- */

function validar(d) {
  if (!d || typeof d !== 'object') return 'Dados inválidos.';
  if (!d.atleta || !limpo(d.atleta.nome)) return 'Falta o nome do atleta.';
  if (!d.responsavel || !limpo(d.responsavel.telefone)) return 'Falta o WhatsApp do responsável.';
  if (d.acompanhantes && !Array.isArray(d.acompanhantes)) return 'Lista de acompanhantes inválida.';
  if ((d.acompanhantes || []).length > MAX_ACOMPANHANTES) return 'Acompanhantes demais.';
  if (DOCUMENTO_OBRIGATORIO) {
    if (!temDoc(d.atleta.documento)) return 'Falta o RG ou CPF do atleta.';
    if (d.responsavel.vaiAoEvento === true && !temDoc(d.responsavel.documento)) return 'Falta o RG ou CPF do responsável.';
    var semDoc = (d.acompanhantes || []).filter(function (p) { return p && limpo(p.nome) && !temDoc(p.documento); });
    if (semDoc.length) return 'Falta o RG ou CPF de: ' + semDoc.map(function (p) { return limpo(p.nome); }).join(', ') + '.';
  }
  return '';
}

function temDoc(v) {
  return limpo(v).replace(/\D/g, '').length >= 5;
}

/**
 * Transforma o JSON enviado pelo site em linhas das duas abas.
 * Função pura (sem acesso à planilha) — dá para testar fora do Google.
 */
function montarLinhas(d, carimbo) {
  var a = d.atleta || {};
  var r = d.responsavel || {};
  var acomp = (d.acompanhantes || []).filter(function (p) { return p && limpo(p.nome); });
  var protocolo = limpo(d.protocolo) || ('BC-' + Math.random().toString(36).slice(2, 8).toUpperCase());
  var nomeAtleta = limpo(a.nome);
  var tel = limpo(r.telefone);
  var vai = r.vaiAoEvento === true;
  var total = 1 + (vai ? 1 : 0) + acomp.length;

  var atleta = [
    carimbo, protocolo, nomeAtleta, limpo(a.apelido), dataBR(a.nascimento), idadeNoEvento(a.nascimento),
    limpo(a.documento), limpo(a.participacao), limpo(a.cordaAtual),
    limpo(r.nome), limpo(r.parentesco), limpo(r.documento), tel, limpo(r.email),
    vai ? 'Sim' : 'Não', acomp.length,
    acomp.map(function (p) { return limpo(p.nome) + ' (' + (limpo(p.parentesco) || '—') + ')'; }).join('; '),
    total, limpo(d.usoImagem), limpo(d.observacoes)
  ];

  var acesso = [[carimbo, protocolo, nomeAtleta, 'Atleta', '—', limpo(a.documento), simNao(idadeNoEvento(a.nascimento) !== '' && idadeNoEvento(a.nascimento) <= 12), nomeAtleta, tel]];
  if (vai) {
    acesso.push([carimbo, protocolo, limpo(r.nome), 'Responsável', limpo(r.parentesco), limpo(r.documento), 'Não', nomeAtleta, tel]);
  }
  acomp.forEach(function (p) {
    acesso.push([carimbo, protocolo, limpo(p.nome), 'Acompanhante', limpo(p.parentesco), limpo(p.documento), simNao(p.crianca === true), nomeAtleta, tel]);
  });

  return { protocolo: protocolo, atleta: atleta.map(seguro), acesso: acesso.map(function (l) { return l.map(seguro); }) };
}

function limpo(v) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, 500);
}

/**
 * Força texto: evita que "=..." vire fórmula e que documentos/telefones/datas
 * percam zeros à esquerda ou sejam convertidos (o apóstrofo fica invisível).
 */
function seguro(v) {
  if (typeof v !== 'string' || v === '') return v;
  return /^[=+\-@']/.test(v) || /^[\d\s.,:\/()\-]+$/.test(v) ? "'" + v : v;
}

function simNao(b) { return b ? 'Sim' : 'Não'; }

function dataBR(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpo(iso));
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

function idadeNoEvento(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpo(iso));
  if (!m) return '';
  var ev = DATA_EVENTO.split('-').map(Number);
  var y = +m[1], mo = +m[2], dd = +m[3];
  var idade = ev[0] - y;
  if (ev[1] < mo || (ev[1] === mo && ev[2] < dd)) idade--;
  return idade >= 0 && idade < 120 ? idade : '';
}

/* ------------------------- planilha -------------------------------- */

function garantirAba(ss, nome, cabecalho, cor) {
  var aba = ss.getSheetByName(nome);
  if (!aba) aba = ss.insertSheet(nome);
  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho])
      .setFontWeight('bold').setFontColor('#FFFFFF').setBackground(cor).setVerticalAlignment('middle');
    aba.setFrozenRows(1);
    aba.setRowHeight(1, 32);
    aba.setColumnWidths(1, cabecalho.length, 160);
  }
  return aba;
}

function escrever(aba, linhas) {
  var ini = aba.getLastRow() + 1;
  if (ini + linhas.length > aba.getMaxRows()) {
    aba.insertRowsAfter(aba.getMaxRows(), linhas.length + 200);
  }
  aba.getRange(ini, 1, linhas.length, linhas[0].length).setValues(linhas);
  return ini;
}

function protocoloJaExiste(aba, protocolo) {
  var n = aba.getLastRow() - 1;
  if (n < 1) return false;
  return aba.getRange(2, 2, n, 1).getDisplayValues().some(function (l) { return l[0] === protocolo; });
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------- teste manual ---------------------------- */

/** Rode esta função no editor (botão ▶) para testar se a planilha recebe uma linha. */
function testeManual() {
  var exemplo = {
    protocolo: 'BC-TESTE' + Math.floor(Math.random() * 1000),
    atleta: { nome: 'Atleta Teste', apelido: 'Teste', nascimento: '2016-05-10', documento: '0123456789', participacao: 'Batizado (primeira corda)', cordaAtual: '' },
    responsavel: { nome: 'Responsável Teste', parentesco: 'Mãe', documento: '11122233344', telefone: '(51) 99999-9999', email: '', vaiAoEvento: true },
    acompanhantes: [{ nome: 'Avó Teste', parentesco: 'Avó', documento: '5556667778', crianca: false }],
    observacoes: 'Linha de teste — pode apagar', usoImagem: 'Sim', ciente: true
  };
  var r = doPost({ postData: { contents: JSON.stringify(exemplo) } });
  Logger.log(r.getContent());
}
