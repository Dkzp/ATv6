// ==================================================
//                CLASSES (Atualizadas)
// ==================================================
/** Representa um registro de manutenção. */
class Manutencao { /* ... (sem alterações da v5) ... */
    constructor(d,t,c,desc=''){this.data=d instanceof Date?d:(d?new Date(d):null);if(this.data&&isNaN(this.data.getTime()))this.data=null;this.tipo=String(t||'').trim();this.custo=parseFloat(c)||0;this.descricao=String(desc||'').trim();}
    formatar(){if(!this.data)return "Manut. data inválida";const dFmt=this.data.toLocaleDateString('pt-BR',{timeZone:'UTC'}),cFmt=this.custo>0?` - R$ ${this.custo.toFixed(2)}`:"";return `${this.tipo||'(? tipo)'} em ${dFmt}${cFmt}${this.descricao?` (${this.descricao})`:''}`;}
    formatarComHora(){if(!this.data)return "Agend. data inválida";const dHFmt=this.data.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),cFmt=this.custo>0?` - Custo Est.: R$ ${this.custo.toFixed(2)}`:"";return `${this.tipo||'(? tipo)'} agendado p/ ${dHFmt}${cFmt}${this.descricao?` (Obs: ${this.descricao})`:''}`;}
    validar(){return this.data instanceof Date&&!isNaN(this.data.getTime())&&typeof this.tipo==='string'&&this.tipo!==''&&typeof this.custo==='number'&&this.custo>=0;}
    toJSON(){return !this.data?null:{data:this.data.toISOString(),tipo:this.tipo,custo:this.custo,descricao:this.descricao};}
}

/** Classe base para veículos. */
class CarroBase {
    constructor(id, modelo, cor, imagemSrc = 'default_car.png', placa = '', ano = '', dataVencimentoCNH = null) {
        if(!id||!modelo)throw new Error("ID/Modelo obrigatórios."); this.id=id; this.modelo=String(modelo||'Padrão').trim(); this.cor=String(cor||'Padrão').trim();
        this.imagemSrc = imagemSrc || 'default_car.png'; // Pode ser filename ou Base64
        this.placa=String(placa||'').trim().toUpperCase(); this.ano=parseInt(ano)||null; this.dataVencimentoCNH=dataVencimentoCNH instanceof Date?dataVencimentoCNH:(dataVencimentoCNH?new Date(dataVencimentoCNH):null); if(this.dataVencimentoCNH&&isNaN(this.dataVencimentoCNH.getTime()))this.dataVencimentoCNH=null;
        this.velocidade=0; this.ligado=false; this.historicoManutencao=[];
        // Preview não é mais necessário como propriedade da classe
    }
    // --- Ações ---
    ligar(){if(!this.ligado){this.ligado=true;this.tocarSom('som-ligar');this.atualizarInformacoesUI("Ligou");}}
    desligar(){if(this.ligado){this.ligado=false;this.velocidade=0;this.tocarSom('som-desligar');this.atualizarInformacoesUI("Desligou");}}
    acelerar(){if(this.ligado){this.velocidade=Math.min(this.velocidade+10,200);this.tocarSom('som-acelerar');this.atualizarInformacoesUI("Acelerou");}else{this.notificarUsuario(`Ligue ${this.modelo}!`);}}
    frear(){if(this.velocidade>0){this.velocidade=Math.max(this.velocidade-15,0);this.tocarSom('som-frear');this.atualizarInformacoesUI("Freou");}}
    buzinar(){this.tocarSom('som-buzinar');console.log(`${this.id} buzinou`);}
    // --- Manutenção ---
    adicionarManutencao(m){if(!(m instanceof Manutencao&&m.validar())){this.notificarUsuario("Erro dados manutenção.");return false;}if(!Array.isArray(this.historicoManutencao))this.historicoManutencao=[];this.historicoManutencao.push(m);this.historicoManutencao.sort((a,b)=>(b.data?.getTime()||0)-(a.data?.getTime()||0));salvarGaragem();this.atualizarInformacoesUI("Manut Adicionada");atualizarExibicaoAgendamentosFuturos();return true;}
    getHistoricoManutencaoFormatado(){const agora=new Date();const hist=(this.historicoManutencao||[]).filter(m=>m instanceof Manutencao&&m.data instanceof Date&&!isNaN(m.data.getTime()));return {passadas:hist.filter(m=>m.data<=agora).map(m=>m.formatar()),futuras:hist.filter(m=>m.data>agora).map(m=>m.formatarComHora())};}
    limparHistoricoManutencao(){this.historicoManutencao=[];salvarGaragem();this.atualizarInformacoesUI("Hist Limpo");atualizarExibicaoAgendamentosFuturos();}
    // --- UI e Aux ---
    /** Atualiza a interface do veículo atualmente exibido */
    atualizarInformacoesUI(origem="Desconhecida") {
        const displayArea=document.getElementById('veiculo-display-area'); if(!displayArea||displayArea.dataset.veiculoId!==this.id)return;
        const getEl=(sel)=>displayArea.querySelector(sel), setTxt=(sel,txt)=>{const el=getEl(sel);if(el)el.textContent=txt;}, setHtml=(sel,html)=>{const el=getEl(sel);if(el)el.innerHTML=html;}, setCls=(sel,base,st)=>{const el=getEl(sel);if(el)el.className=`${base} ${st}`;};
        const setImg=(sel,src,alt)=>{const el=getEl(sel);if(el){el.src=src||'default_car.png';el.alt=alt||`Imagem ${this.modelo}`;el.onerror=()=>{if(el.src!=='default_car.png')el.src='default_car.png';el.onerror=null;};}};

        setTxt('.veiculo-titulo', this.modelo);
        setImg('.veiculo-imagem', this.imagemSrc, `Imagem ${this.modelo}`); // Usa imagemSrc (pode ser Base64 ou filename)
        setTxt('.veiculo-status', this.ligado?"Ligado":"Desligado"); setCls('.veiculo-status','veiculo-status',this.ligado?"status-ligado":"status-desligado");
        setTxt('.veiculo-velocidade',this.velocidade); setTxt('.veiculo-placa',this.placa||'-'); setTxt('.veiculo-ano',this.ano||'-');
        let extra='',cnh=''; if(this instanceof CarroEsportivo)extra=`<span class="info-label">Turbo:</span> ${this.turboAtivado?'ON 🔥':'OFF'}`; else if(this instanceof Caminhao)extra=`<span class="info-label">Carga:</span> ${this.cargaAtual}/${this.capacidadeCarga}kg`; setHtml('.veiculo-info-extra',extra);
        if(this.dataVencimentoCNH){const dtV=this.dataVencimentoCNH,hj=new Date();hj.setHours(0,0,0,0);const dias=Math.ceil((dtV.getTime()-hj.getTime())/(1e3*60*60*24));cnh=`<span class="info-label">Venc. CNH:</span> ${dtV.toLocaleDateString('pt-BR',{timeZone:'UTC'})}`;if(dias<0)cnh+=' <span style="color:red;font-weight:bold;">(VENCIDA!)</span>';else if(dias<=30)cnh+=` <span style="color:orange;font-weight:bold;">(Vence em ${dias}d!)</span>`;}else cnh='<span class="info-label">Venc. CNH:</span> -'; setHtml('.veiculo-cnh-info',cnh);
        const barra=getEl('.veiculo-barra-progresso'); if(barra){const p=Math.min((this.velocidade/200)*100,100);barra.style.width=`${p}%`;} const pont=getEl('.veiculo-ponteiro'); if(pont){const a=Math.min((this.velocidade/200)*180,180);pont.style.transform=`translateX(-50%) rotate(${a-90}deg)`;}
        const histDiv=getEl('.lista-historico'); if(histDiv){const {passadas}=this.getHistoricoManutencaoFormatado();histDiv.innerHTML=passadas.length>0?`<ul>${passadas.map(i=>`<li>${i}</li>`).join('')}</ul>`:'<p>Nenhuma manutenção.</p>';}
        const editForm=getEl('.edicao-veiculo'); if(editForm){editForm.querySelector('.edit-modelo-veiculo').value=this.modelo;editForm.querySelector('.edit-cor-veiculo').value=this.cor;editForm.querySelector('.edit-placa-veiculo').value=this.placa;editForm.querySelector('.edit-ano-veiculo').value=this.ano||'';editForm.querySelector('.edit-cnh-veiculo').value=this.dataVencimentoCNH?this.dataVencimentoCNH.toISOString().split('T')[0]:'';}
    }
    tocarSom(id){const a=document.getElementById(id);if(a){a.currentTime=0;a.play().catch(e=>console.warn(`Audio ${id}: ${e.message}`));}}
    notificarUsuario(msg){alert(`${this.modelo}: ${msg}`);}
    /** Converte para JSON */
    toJSON(){const hist=(this.historicoManutencao||[]).filter(m=>m instanceof Manutencao&&m.validar()).map(m=>m.toJSON());let tipo='CarroBase';if(this instanceof CarroEsportivo)tipo='CarroEsportivo';else if(this instanceof Caminhao)tipo='Caminhao';const data={id:this.id,modelo:this.modelo,cor:this.cor,placa:this.placa,ano:this.ano,dataVencimentoCNH:this.dataVencimentoCNH?.toISOString()||null,velocidade:this.velocidade,ligado:this.ligado,imagemSrc:this.imagemSrc,tipoVeiculo:tipo,historicoManutencao:hist};if(tipo==='CarroEsportivo')data.turboAtivado=this.turboAtivado;else if(tipo==='Caminhao'){data.capacidadeCarga=this.capacidadeCarga;data.cargaAtual=this.cargaAtual;}return data;}
}

/** Classe Carro Esportivo */
class CarroEsportivo extends CarroBase {
    constructor(id,modelo,cor,img,placa,ano,cnh){super(id,modelo,cor,img||'default_sport.png',placa,ano,cnh);this.turboAtivado=false;}
    ativarTurbo(){if(this.ligado){this.turboAtivado=!this.turboAtivado;this.atualizarInformacoesUI("Turbo");}else{this.notificarUsuario('Ligue!');}}
    acelerar(){if(this.ligado){this.velocidade=Math.min(this.velocidade+(this.turboAtivado?25:15),250);this.tocarSom('som-acelerar');this.atualizarInformacoesUI("Acelerou");}else{this.notificarUsuario('Ligue!');}}
}

/** Classe Caminhão */
class Caminhao extends CarroBase {
    constructor(id,modelo,cor,img,placa,ano,cnh,capCarga=0){super(id,modelo,cor,img||'default_truck.png',placa,ano,cnh);this.capacidadeCarga=parseInt(capCarga)||0;this.cargaAtual=0;}
    carregar(p){const n=parseInt(p);if(isNaN(n)||n<=0){this.notificarUsuario("Peso inválido.");return;}if(this.cargaAtual+n<=this.capacidadeCarga){this.cargaAtual+=n;this.atualizarInformacoesUI("Carregou");}else{this.notificarUsuario(`Carga excedida.`);}}
    acelerar(){if(this.ligado){const fC=1-(this.cargaAtual/(this.capacidadeCarga*1.5||1));this.velocidade=Math.min(this.velocidade+Math.max(1,Math.round(8*fC)),140);this.tocarSom('som-acelerar');this.atualizarInformacoesUI("Acelerou");}else{this.notificarUsuario('Ligue!');}}
}

// ==================================================
//      GERENCIAMENTO DA GARAGEM & PERSISTÊNCIA
// ==================================================
let garagem = {};
const GARAGEM_KEY = 'garagemData_v6_add'; // Chave atualizada

/** Salva a garagem no localStorage COM TRATAMENTO DE QUOTA */
function salvarGaragem() {
    try {
        // Tenta salvar a garagem inteira (que pode conter Base64)
        localStorage.setItem(GARAGEM_KEY, JSON.stringify(garagem));
        console.log(`Garagem salva.`);
        return true; // Indica sucesso
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.error("ERRO DE QUOTA: LocalStorage cheio, provavelmente devido a imagem(ns) grande(s).");
            alert("ERRO AO SALVAR: Armazenamento cheio! A imagem pode ser muito grande.\n\nAs últimas alterações (incluindo a imagem) NÃO foram salvas permanentemente.");
        } else {
            console.error("ERRO AO SALVAR GARAGEM:", e);
            alert("Ocorreu um erro inesperado ao salvar os dados.");
        }
        return false; // Indica falha
    }
}

/** Carrega a garagem do localStorage */
function carregarGaragem() {
    const dataJSON = localStorage.getItem(GARAGEM_KEY); garagem = {}; let carregouOk = false;
    if (dataJSON) {
        try { const gData = JSON.parse(dataJSON);
            for(const id in gData){ const d=gData[id]; if(!d?.id || !d?.modelo || !d?.tipoVeiculo) continue; let v;
                const hist = (d.historicoManutencao||[]).map(m=>(!m?.data||!m?.tipo)?null:new Manutencao(m.data,m.tipo,m.custo,m.descricao)).filter(m=>m&&m.validar());
                try { const args=[d.id,d.modelo,d.cor,d.imagemSrc,d.placa,d.ano,d.dataVencimentoCNH];
                    switch(d.tipoVeiculo){ case 'CarroEsportivo': v=new CarroEsportivo(...args);v.turboAtivado=d.turboAtivado||false; break; case 'Caminhao': v=new Caminhao(...args,d.capacidadeCarga||0);v.cargaAtual=d.cargaAtual||0; break; default: v=new CarroBase(...args); break; }
                    v.velocidade=d.velocidade||0; v.ligado=d.ligado||false; v.historicoManutencao=hist; garagem[id]=v;
                } catch(crErr){ console.error(`Erro recriar ${id}`,crErr); }
            } console.log("Garagem carregada."); carregouOk = true;
        } catch(e){ console.error("CARREGAR ERRO:",e); alert("ERRO ao carregar. Resetando."); localStorage.removeItem(GARAGEM_KEY); }
    }
    if (!carregouOk) { console.log("Inicializando padrão."); inicializarVeiculosPadrao(); } // Chama inicializar se falhou ou não tinha dados
    else { atualizarInterfaceCompleta(); } // Atualiza UI se carregou
}

/** Inicializa com veículos padrão */
function inicializarVeiculosPadrao() {
    garagem = {}; try {
        garagem['carro1'] = new CarroBase("carro1","Fusca","Azul","default_car.png","ABC1234",1975,"2024-12-31");
        garagem['carro2'] = new CarroEsportivo("carro2","Maverick","Laranja","default_sport.png","DEF5678",1974,"2025-06-01");
        garagem['cam1'] = new Caminhao("cam1","Scania 113","Vermelho","default_truck.png","GHI9012",1995,"2023-01-10",20000);
        console.log("Padrão criado."); if(!salvarGaragem()) console.warn("Falha ao salvar garagem padrão inicial (quota?)."); // Tenta salvar
    } catch(e){ console.error("INIT ERRO:",e); alert("Erro init padrão."); }
    atualizarInterfaceCompleta(); // Atualiza UI mesmo se falhar
}

/** Atualiza a interface inteira */
function atualizarInterfaceCompleta() {
    console.log("Atualizando UI completa...");
    atualizarMenuVeiculos();
    atualizarExibicaoAgendamentosFuturos();
    verificarVencimentoCNH();
    verificarAgendamentosProximos();
    const primeiroId = Object.keys(garagem)[0];
    if (primeiroId && document.getElementById('veiculo-display-area')?.dataset.veiculoId !== primeiroId) {
        marcarBotaoAtivo(primeiroId);
        renderizarVeiculo(primeiroId);
    } else if (!primeiroId) {
        limparAreaDisplay(true);
    } else {
        // Se já tem um veículo exibido, apenas garante que está atualizado
        const veiculoAtual = garagem[document.getElementById('veiculo-display-area').dataset.veiculoId];
        veiculoAtual?.atualizarInformacoesUI("Atualização Completa");
    }
    console.log("UI completa OK.");
}

/** Limpa a área de display ou mostra placeholder */
function limparAreaDisplay(mostrarPlaceholder = false) { const d=document.getElementById('veiculo-display-area'); if(d){d.innerHTML=mostrarPlaceholder?'<div class="placeholder">Garagem vazia. Adicione!</div>':'<div class="placeholder">Selecione um veículo.</div>'; delete d.dataset.veiculoId;} }
/** Atualiza o menu de botões dos veículos */
function atualizarMenuVeiculos() { const m=document.getElementById('menu-veiculos'); if(!m)return; m.innerHTML=''; const ids=Object.keys(garagem); if(ids.length===0){m.innerHTML='<span>Garagem vazia.</span>';return;} ids.forEach(id=>{const v=garagem[id];if(v){const b=document.createElement('button');b.textContent=v.modelo;b.dataset.veiculoId=id;b.title=`${v.modelo} (${v.placa||'s/p'}) - ${v.ano||''}`;b.addEventListener('click',()=>{marcarBotaoAtivo(id);renderizarVeiculo(id);});m.appendChild(b);}}); }
/** Marca visualmente o botão ativo no menu */
function marcarBotaoAtivo(id) { document.querySelectorAll('#menu-veiculos button').forEach(b=>b.classList.toggle('veiculo-ativo',b.dataset.veiculoId===id)); }


// ==================================================
//       RENDERIZAÇÃO DINÂMICA DO VEÍCULO
// ==================================================

/** Renderiza o veículo selecionado na área de display */
function renderizarVeiculo(veiculoId) {
    const veiculo = garagem[veiculoId]; const displayArea = document.getElementById('veiculo-display-area'); const template = document.getElementById('veiculo-template');
    if (!veiculo || !displayArea || !template) { console.error(`Erro renderizar ${veiculoId}`); limparAreaDisplay(true); return; }

    const clone = template.content.cloneNode(true); const container = clone.querySelector('.veiculo-renderizado');

    // --- Adiciona Listeners DENTRO do clone ---
    container.querySelectorAll('.acoes-veiculo button[data-acao]').forEach(btn => {
        const acao = btn.dataset.acao;
        btn.addEventListener('click', () => interagirVeiculoAtual(acao)); // Delega para função auxiliar
    });
    container.querySelector('.btn-excluir-veiculo')?.addEventListener('click', () => handleExcluirVeiculo(veiculoId));
    container.querySelector('.salvar-veiculo-btn')?.addEventListener('click', () => handleSalvarEdicaoVeiculo(veiculoId)); // Botão correto
    container.querySelector('.form-agendamento')?.addEventListener('submit', (e) => handleAgendarManutencao(e, veiculoId));
    container.querySelector('.btn-limpar-historico')?.addEventListener('click', () => handleLimparHistorico(veiculoId));
    // Listener para Input de Imagem na Edição
    const editImgInput = container.querySelector('.edit-imagem-input');
    const editImgPreview = container.querySelector('.edit-imagem-preview');
    if(editImgInput && editImgPreview) {
        editImgInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if(file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    editImgPreview.src = e.target.result; // Mostra preview Base64
                    editImgPreview.style.display = 'block';
                }
                reader.onerror = () => { editImgPreview.src='#'; editImgPreview.style.display='none'; }
                reader.readAsDataURL(file); // Lê como Base64 para preview
            } else {
                editImgPreview.src = '#';
                editImgPreview.style.display = 'none';
            }
        });
    }

    // Configura botões/inputs específicos (Turbo/Carga)
    const acaoExtraEl = container.querySelector('.acao-extra'); acaoExtraEl.innerHTML = '';
    if (veiculo instanceof CarroEsportivo) { const btn=document.createElement('button');btn.dataset.acao='ativarTurbo';btn.textContent='Turbo';acaoExtraEl.appendChild(btn); }
    else if (veiculo instanceof Caminhao) { const div=document.createElement('div');div.className='carga-container';div.innerHTML=`<label>Carga(kg):</label><input type="number" min="1" placeholder="Peso"><button data-acao="carregar">Carregar</button>`;acaoExtraEl.appendChild(div);
        // Adiciona listener específico para o botão carregar DENTRO deste contexto
        const cargaBtn = div.querySelector('button[data-acao="carregar"]');
        const inputCarga = div.querySelector('input[type="number"]');
        if(cargaBtn && inputCarga) cargaBtn.addEventListener('click', () => interagirVeiculoAtual('carregar', inputCarga));
    }

    // --- Limpa área e adiciona clone ---
    displayArea.innerHTML = ''; displayArea.appendChild(clone); displayArea.dataset.veiculoId = veiculoId;
    // --- Atualiza UI inicial ---
    veiculo.atualizarInformacoesUI("Renderização Completa");
    console.log(`Veículo ${veiculoId} renderizado.`);
}

/** Função auxiliar para chamar interagir no veículo atual */
function interagirVeiculoAtual(acao, extraElement = null) {
    const displayArea = document.getElementById('veiculo-display-area'); const veiculoId = displayArea?.dataset.veiculoId;
    if (veiculoId) {
        if (acao === 'carregar' && extraElement instanceof HTMLInputElement) { interagir(veiculoId, acao, extraElement.value); extraElement.value = ''; }
        else { interagir(veiculoId, acao); } // Chama interagir sem o valor
    } else { console.warn("Nenhum veículo selecionado."); }
}

/** Executa ação no veículo */
function interagir(veiculoId, acao, arg = null) {
    const v = garagem[veiculoId]; if (!v) { alert(`Veículo ${veiculoId}?`); return; }
    console.log(`Interagir: ${acao}, V: ${veiculoId}, Arg: ${arg}`);
    try {
        switch (acao) {
            case 'ligar': v.ligar(); break; case 'desligar': v.desligar(); break;
            case 'acelerar': v.acelerar(); break; case 'frear': v.frear(); break;
            case 'buzinar': v.buzinar(); break;
            case 'ativarTurbo': if (v instanceof CarroEsportivo) v.ativarTurbo(); else v.notificarUsuario("Só esportivos."); break;
            case 'carregar': if (v instanceof Caminhao) v.carregar(arg); else v.notificarUsuario("Só caminhões."); break;
            default: console.warn(`Ação ? ${acao}`);
        }
    } catch (e) { console.error(`Erro ${acao} ${vId}`,e); /*alert(`Erro ao ${acao}.`);*/ } // Silenciar alerta?
}

// ==================================================
//          HANDLERS DE EVENTOS
// ==================================================
/** Handler para trocar Abas */
function handleTrocarAba(abaId) { document.querySelectorAll('.secao-principal').forEach(s=>s.classList.remove('ativa')); document.querySelectorAll('#abas-navegacao button').forEach(b=>b.classList.remove('aba-ativa')); const sId=abaId==='tab-garagem'?'secao-garagem':'secao-adicionar'; document.getElementById(sId)?.classList.add('ativa'); document.getElementById(abaId)?.classList.add('aba-ativa'); }
/** Handler para Adicionar Veículo */
function handleAdicionarVeiculo(event) { event.preventDefault(); const form=event.target; const mod=form.querySelector('#add-modelo').value.trim(), cor=form.querySelector('#add-cor').value.trim(); const plc=form.querySelector('#add-placa').value.trim().toUpperCase(), ano=form.querySelector('#add-ano').value; const tipo=form.querySelector('#add-tipo').value, capIn=form.querySelector('#add-capacidade-carga'); const capCg=(tipo==='Caminhao'&&capIn)?capIn.value:0; const dtCnh=form.querySelector('#add-cnh').value; if(!mod||!tipo){alert("Modelo e Tipo obrigatórios!");return;} const nId=`v${Date.now()}`; let imgP=tipo==='CarroEsportivo'?'default_sport.png':(tipo==='Caminhao'?'default_truck.png':'default_car.png'); let nV; try{const args=[nId,mod,cor,imgP,plc,ano,dtCnh||null]; switch(tipo){case 'CarroEsportivo':nV=new CarroEsportivo(...args);break;case 'Caminhao':nV=new Caminhao(...args,capCg);break;default:nV=new CarroBase(...args);break;} garagem[nId]=nV; if(salvarGaragem()){atualizarMenuVeiculos();form.reset();document.getElementById('add-capacidade-carga-container').style.display='none';document.getElementById('add-imagem-preview').src='#';document.getElementById('add-imagem-preview').style.display='none';handleTrocarAba('tab-garagem');marcarBotaoAtivo(nId);renderizarVeiculo(nId);alert(`Veículo "${mod}" adicionado!`);} else { delete garagem[nId]; /* Remove se falhou ao salvar */ }} catch(e){console.error("Erro add veic:",e);alert("Erro ao adicionar.");}}
/** Handler para Salvar Edições (TENTA salvar imagem Base64) */
function handleSalvarEdicaoVeiculo(veiculoId) {
     const v=garagem[veiculoId], display=document.getElementById('veiculo-display-area'); if(!v||!display||display.dataset.veiculoId!==v.id){alert("Erro salvar.");return;}
     const form=display.querySelector('.edicao-veiculo'); if(!form){alert("Erro form edicao.");return;} console.log(`Salvando edições ${veiculoId}`); let mudou=false;
     const nMod=form.querySelector('.edit-modelo-veiculo').value.trim(), nCor=form.querySelector('.edit-cor-veiculo').value.trim(); const nPla=form.querySelector('.edit-placa-veiculo').value.trim().toUpperCase(), nAno=parseInt(form.querySelector('.edit-ano-veiculo').value)||null; const nCnhS=form.querySelector('.edit-cnh-veiculo').value, nCnhD=nCnhS?new Date(nCnhS+'T00:00:00'):null; if(nCnhD&&isNaN(nCnhD.getTime()))nCnhD=null;
     // Verifica mudanças nos campos de texto/data
     if(nMod&&v.modelo!==nMod){v.modelo=nMod;mudou=true;} if(v.cor!==nCor){v.cor=nCor;mudou=true;} if(v.placa!==nPla){v.placa=nPla;mudou=true;} if(v.ano!==nAno){v.ano=nAno;mudou=true;} const cnhAt=v.dataVencimentoCNH?.getTime(),cnhNv=nCnhD?.getTime();if(cnhAt!==cnhNv){v.dataVencimentoCNH=nCnhD;mudou=true;}

     const imagemInput = form.querySelector('.edit-imagem-input');
     const file = imagemInput?.files[0];

     // Se uma NOVA imagem foi selecionada, tenta lê-la e salvá-la
     if (file && file.type.startsWith("image/")) {
         const reader = new FileReader();
         reader.onload = function(e) {
             const novaImagemBase64 = e.target.result;
             // Verifica se a nova imagem é diferente da atual (evita salvar desnecessariamente)
             if (v.imagemSrc !== novaImagemBase64) {
                 const imagemAntiga = v.imagemSrc; // Guarda a imagem antiga caso salvar falhe
                 v.imagemSrc = novaImagemBase64; // ATUALIZA imagemSrc com Base64
                 mudou = true;
                 console.log(`Imagem ${veiculoId} atualizada (Base64)`);
                 // Tenta salvar TUDO (incluindo a nova imagem Base64)
                 if (salvarGaragem()) {
                     v.atualizarInformacoesUI("Edição Salva c/ Img");
                     atualizarMenuVeiculos(); // Atualiza menu se modelo mudou
                     verificarVencimentoCNH(); // Re-verifica CNH
                     alert("Alterações (incluindo imagem) salvas!");
                 } else {
                     // Se salvar falhou (provavelmente quota), reverte a imagem no objeto
                     v.imagemSrc = imagemAntiga;
                     v.atualizarInformacoesUI("Falha Salvar Img"); // Atualiza UI de volta
                     // O alerta de erro de quota já foi dado em salvarGaragem()
                 }
             } else if (mudou) { // Se só outros campos mudaram, salva sem reler a imagem
                  if (salvarGaragem()) { v.atualizarInformacoesUI("Edição Salva s/ Img Nova"); atualizarMenuVeiculos(); verificarVencimentoCNH(); alert("Alterações salvas!"); }
             } else { alert("Nenhuma alteração detectada."); }
              // Limpa input e preview da edição
              if(imagemInput) imagemInput.value = ''; const p=form.querySelector('.edit-imagem-preview'); if(p){p.src='#';p.style.display='none';}
         }
         reader.onerror = function() { alert("Erro ao ler o arquivo de imagem."); if(imagemInput) imagemInput.value = ''; }
         reader.readAsDataURL(file); // Inicia a leitura
     }
     // Se NENHUMA imagem foi selecionada E outros campos mudaram
     else if (mudou) {
         if (salvarGaragem()) { v.atualizarInformacoesUI("Edição Salva"); atualizarMenuVeiculos(); verificarVencimentoCNH(); alert("Alterações salvas!"); }
         // Limpa input e preview (caso tivesse algo antes e foi cancelado)
         if(imagemInput) imagemInput.value = ''; const p=form.querySelector('.edit-imagem-preview'); if(p){p.src='#';p.style.display='none';}
     }
     // Se nada mudou
     else {
         alert("Nenhuma alteração detectada.");
         // Limpa input e preview
         if(imagemInput) imagemInput.value = ''; const p=form.querySelector('.edit-imagem-preview'); if(p){p.src='#';p.style.display='none';}
     }
}

/** Handler para agendar manutenção */
function handleAgendarManutencao(event,veiculoId){event.preventDefault();const v=garagem[veiculoId];if(!v)return;const form=event.target;const dI=form.querySelector('.agendamento-data'),hI=form.querySelector('.agendamento-hora'),tI=form.querySelector('.agendamento-tipo'),cI=form.querySelector('.agendamento-custo'),oI=form.querySelector('.agendamento-obs');if(!dI||!tI)return;const dS=dI.value,hS=hI?.value||'00:00',tS=tI.value.trim(),cS=cI?.value,oS=oI?.value.trim();if(!dS||!tS){alert('Data e Tipo!');return;}const dt=new Date(`${dS}T${hS}:00`);if(isNaN(dt.getTime())){alert('Data/Hora inválida');return;}const m=new Manutencao(dt,tS,cS,oS);if(v.adicionarManutencao(m)){alert('Agendado!');form.reset();}}
/** Handler para limpar histórico */
function handleLimparHistorico(veiculoId){const v=garagem[veiculoId];if(!v)return;if(confirm(`Apagar TODO histórico de ${v.modelo}?`)){try{v.limparHistoricoManutencao();}catch(e){alert('Erro ao limpar.');}}}
/** Handler para EXCLUIR veículo */
function handleExcluirVeiculo(veiculoId){const v=garagem[veiculoId];if(!v)return;if(confirm(`EXCLUIR "${v.modelo}" (${v.placa||'s/p'})?\n\nNÃO pode ser desfeito!`)){try{delete garagem[veiculoId];salvarGaragem();atualizarInterfaceCompleta();alert(`"${v.modelo}" excluído.`);}catch(e){alert("Erro ao excluir.");}}}

// ==================================================
//      ALERTAS (Agendamentos e CNH)
// ==================================================
function atualizarExibicaoAgendamentosFuturos(){const d=document.getElementById('agendamentos-futuros-lista');if(!d)return;d.innerHTML='';const ag=new Date(),tds=[];Object.values(garagem).forEach(v=>{(v.historicoManutencao||[]).forEach(m=>{if(m?.data instanceof Date&&!isNaN(m.data.getTime())&&m.data>ag){tds.push({m:m,v:v.modelo});}});});tds.sort((a,b)=>a.m.data.getTime()-b.m.data.getTime());if(tds.length>0){d.innerHTML=`<ul>${tds.map(i=>`<li><strong>${i.v}:</strong> ${i.m.formatarComHora()}</li>`).join('')}</ul>`;}else{d.innerHTML='<p>Nenhum agendamento futuro.</p>';}}
function verificarAgendamentosProximos(){const a=document.getElementById('notificacoes-area');const ag=new Date(),fA=new Date();fA.setDate(ag.getDate()+1);fA.setHours(23,59,59,999);let ntf=[];Object.values(garagem).forEach(v=>{(v.historicoManutencao||[]).forEach(m=>{if(m?.data instanceof Date&&!isNaN(m.data.getTime())&&m.data>ag&&m.data<=fA){const hj=m.data.toDateString()===ag.toDateString(),p=hj?"🚨 HOJE":"🗓️ Amanhã",hF=m.data.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});ntf.push(`<li>${p}: ${v.modelo} - ${m.tipo} às ${hF}</li>`);}});});ntf.sort((a,b)=>(a.includes("HOJE")?0:1)-(b.includes("HOJE")?0:1)||a.localeCompare(b));if(a){if(ntf.length>0){a.innerHTML=`<h4><span role="img" aria-label="Alerta">⚠️</span> Alertas Manutenção</h4><ul>${ntf.join('')}</ul>`;a.style.display='block';}else{a.style.display='none';}}}
function verificarVencimentoCNH(){const a=document.getElementById('cnh-alertas-area');if(!a)return;const hj=new Date();hj.setHours(0,0,0,0);let alr=[];Object.values(garagem).forEach(v=>{if(v.dataVencimentoCNH instanceof Date&&!isNaN(v.dataVencimentoCNH.getTime())){const dtV=v.dataVencimentoCNH;const dias=Math.ceil((dtV.getTime()-hj.getTime())/(1e3*60*60*24));if(dias<0){alr.push(`<li><strong>${v.modelo} (${v.placa||'s/p'}):</strong> CNH VENCIDA (${dtV.toLocaleDateString('pt-BR')})!</li>`);}else if(dias<=30){alr.push(`<li><strong>${v.modelo} (${v.placa||'s/p'}):</strong> CNH vence em ${dias}d (${dtV.toLocaleDateString('pt-BR')})!</li>`);}}});if(alr.length>0){a.innerHTML=`<h4><span role="img" aria-label="Carteira">💳</span> Alertas de CNH</h4><ul>${alr.join('')}</ul>`;a.style.display='block';}else{a.style.display='none';}}

// ==================================================
//                   INICIALIZAÇÃO
// ==================================================
function inicializarAplicacao(){console.log("DOM Carregado. Iniciando Garagem v6...");try{setupEventListeners();carregarGaragem();}catch(e){console.error("ERRO CRÍTICO INICIALIZAÇÃO:",e);alert("Erro grave ao iniciar.");}}
function setupEventListeners(){console.log("Configurando Listeners Iniciais...");document.getElementById('tab-garagem')?.addEventListener('click',()=>handleTrocarAba('tab-garagem'));document.getElementById('tab-adicionar')?.addEventListener('click',()=>handleTrocarAba('tab-adicionar'));document.getElementById('form-add-veiculo')?.addEventListener('submit',handleAdicionarVeiculo);const tSel=document.getElementById('add-tipo'),cDiv=document.getElementById('add-capacidade-carga-container');if(tSel&&cDiv)tSel.addEventListener('change',()=>{cDiv.style.display=tSel.value==='Caminhao'?'block':'none';});const addImgIn=document.getElementById('add-imagem-input'),addImgPrv=document.getElementById('add-imagem-preview');if(addImgIn&&addImgPrv){addImgIn.addEventListener('change',(e)=>{const f=e.target.files[0];if(f&&f.type.startsWith("image/")){addImgPrv.src=URL.createObjectURL(f);addImgPrv.style.display='block';addImgPrv.onload=()=>{if(addImgPrv.src.startsWith('blob:'))URL.revokeObjectURL(addImgPrv.src);}}else{addImgPrv.src='#';addImgPrv.style.display='none';}});}}
document.addEventListener('DOMContentLoaded', inicializarAplicacao);