# 🏐 Sistema de Gestão de Aulas de Vôlei de Praia

Aplicação web moderna, ultra-responsiva e otimizada para uso em celulares diretamente nas quadras de areia.

---

## 🌟 Principais Funcionalidades

### 1. ⚡ Registro Rápido de Aula (&lt; 1 Minuto no Celular)
- Seleção imediata de Arena, Turma, Data e Horário.
- **Chamada com 1-Toque**: Toque no card do aluno para alternar entre `🟢 Presente` e `⚪ Ausente`.
- Botões de atalho **"Todos Presentes"** e **"Todos Ausentes"**.
- Contadores em tempo real de presença e taxa de frequência.
- Captura de foto diretamente da câmera do celular (`accept="image/*"`).

### 2. 📸 Status Visual de Fotos & Lembretes
- `🟡 FOTO PENDENTE`: Modal de aviso para lembrar o professor de registrar a foto da turma na areia.
- `🟢 FOTO RECEBIDA`: Foto enviada e pronta para compartilhamento.
- `🔵 PREPARADO PARA ENVIO`: Status atualizado após o disparo.

### 3. 📲 Integração Direta com WhatsApp
- Geração automática de link `https://wa.me/?text=...` com mensagem personalizada:
  > *"Boa noite! Segue a foto da aula de hoje na {Nome_Arena} ({Data}). 🏐📸"*
- Atualização em tempo real para o status `🔵 PREPARADO`.

### 4. 🛡️ Controle de Acesso por Domínio de E-mail (RBAC)
- **Professor (`@prof.com`):** Acesso a Meu Painel, Registro Rápido, Chamada e Fechamento do Mês.
- **Administrador (`@arenaadm.com`):** Acesso ao Painel Geral, Galeria Central de Fotos, Relatórios, Gestão de Alunos, Arenas, Professores e Calendário.
- Qualquer outro domínio recebe a mensagem: *"Este e-mail não possui permissão para acessar o sistema."*

### 5. 📸 Galeria Central & Lightbox
- Feed visual de fotos com filtros dinâmicos por Data, Arena, Professor e Turma.
- Visualizador ampliado (Lightbox) e botão de download.

### 6. 📊 Relatórios Consolidados & Exportação CSV
- Relatórios por Professor e por Arena.
- Botão **Exportar CSV** formatado com delimitador `;` e codificação UTF-8 BOM para abertura perfeita no Excel em português.

---

## 🔑 Credenciais Pré-configuradas para Demonstração

| Papel | E-mail | Senha | Nome |
| :--- | :--- | :--- | :--- |
| **Professor** | `carlos@prof.com` | `senha123` | Carlos Silva |
| **Professora** | `ana@prof.com` | `senha123` | Ana Souza |
| **Administrador** | `gestor@arenaadm.com` | `senha123` | Roberto Gestor |
| **Administrador** | `admin@arenaadm.com` | `senha123` | Administrador da Arena |

---

## 🚀 Como Executar

### 1. Online (Vercel / GitHub Pages)
O projeto é 100% estático e compatível com qualquer plataforma de hospedagem com deploy instantâneo e zero falhas de runtime.

### 2. Localmente
Basta abrir o arquivo `index.html` em qualquer navegador ou rodar um servidor web local:
```bash
npx serve .
# ou
python -m http.server 3000
```
Acesse `http://localhost:3000`.

---

## 📁 Estrutura do Código

```
├── index.html            # Aplicação SPA completa com todas as telas e modais
├── css/
│   ├── style.css         # Design system, tema Vôlei de Praia e layout mobile-first
│   └── components.css    # Cards touch-friendly de presença, galeria e modais
├── js/
│   ├── store.js          # Banco de dados local com seed e persistência reativa
│   ├── quick-class.js    # Fluxo de chamada em 1-toque e envio de foto
│   ├── whatsapp.js       # Integração com links wa.me
│   ├── gallery.js        # Galeria central de fotos e filtros dinâmicos
│   ├── reports.js        # Relatórios mensais e exportador CSV
│   └── app.js            # Roteador SPA, modais e navegação
├── vercel.json           # Configuração de deploy estático
└── README.md             # Documentação em Português (PT-BR)
```
