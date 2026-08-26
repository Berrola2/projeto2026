# 🏐 Sistema de Gestão de Aulas de Vôlei de Praia

Aplicação web completa, moderna e responsiva (mobile-first) desenvolvida em **Python (Flask, SQLAlchemy, Jinja2)** e **Vanilla CSS/JS**, 100% em **Português do Brasil (PT-BR)**, para gestão de aulas, presenças, controle fotográfico e relatórios em quadras e arenas de Vôlei de Praia.

---

## 📸 Funcionalidades Principais

### 1. 👨‍🏫 Fluxo do Professor (`Meu Painel`)
- **Registro Rápido de Aula (< 1 min no celular):** Seleção ágil de Arena, Turma, Data, Horário e lista de chamada com seleção rápida de 1 toque (🟢 Presente / ⚪ Ausente) e atalhos "Todos Presentes" / "Todos Ausentes".
- **Lembrete e Status de Fotos:**
  - `🟡 FOTO PENDENTE`: Ao salvar a aula sem foto, exibe o modal de alerta *"📸 FOTO DA AULA PENDENTE"*.
  - `🟢 FOTO RECEBIDA`: Ao anexar a foto da aula (com suporte direto à câmera do celular).
- **Integração WhatsApp:** Modal *"📲 FOTO PRONTA PARA ENVIO"* com botão para abrir diretamente o WhatsApp (`https://wa.me/?text=...`) com mensagem pré-formatada:
  `"Boa noite! Segue a foto da aula de hoje na Arena Ipanema Beach (26/08/2026). 🏐📸"`
  e atualização automática do status para `🔵 PREPARADO PARA ENVIO`.
- **Fechamento do Mês:** Filtro mensal com indicadores de aulas dadas, alunos atendidos, taxa global de presença e total de fotos registradas.

### 2. 🛡️ Fluxo do Administrador (`Painel Geral`)
- **Dashboard Consolidado:** Métricas diárias (aulas hoje, professores ativos, presença geral e fotos hoje) e métricas mensais.
- **Galeria Central de Fotos:** Feed visual centralizado com filtros por Data, Arena, Professor, Turma e Status, além de visualizador Lightbox e botão de compartilhamento WhatsApp.
- **Relatórios & Exportação CSV:** Relatórios consolidados por Professor e por Arena, com exportação em formato CSV com separador `;` e codificação UTF-8 BOM para compatibilidade com o Excel.
- **Cadastros Administrativos:** Gestão de Alunos, Arenas, Professores e Calendário Geral de aulas.

### 3. 🔐 Controle de Acesso e Permissões (RBAC)
Validação rigorosa por domínio institucional:
- **`@prof.com`:** Papel `PROFESSOR` definido automaticamente. Acesso isolado exclusivamente às suas próprias turmas, aulas e relatórios.
- **`@arenaadm.com`:** Papel `ADMIN` definido automaticamente. Acesso global a todas as arenas e painel executivo.
- **Outros domínios:** Rejeição imediata no cadastro e login com a mensagem: `"Este e-mail não possui permissão para acessar o sistema."`
- **Proteção de Rotas:** Tentativas não autorizadas recebem: `"Você não possui permissão para acessar esta área."`

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Python 3.11 ou superior
- Pip e Git instalados

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Berrola2/projeto2026.git
   cd projeto2026
   ```

2. **Crie e ative um ambiente virtual (recomendado):**
   ```bash
   python -m venv venv
   # No Windows:
   .\venv\Scripts\activate
   # No Linux/Mac:
   source venv/bin/activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Execute a aplicação:**
   ```bash
   python app.py
   ```

5. **Acesse no navegador:**
   [http://127.0.0.1:5000](http://127.0.0.1:5000)

> O banco de dados SQLite será criado e populado automaticamente na primeira execução com dados realistas de exemplo.

---

## 🔑 Usuários e Credenciais de Demonstração

| Papel | E-mail Autorizado | Senha | Nome | Acesso |
| :--- | :--- | :--- | :--- | :--- |
| **Professor** | `carlos@prof.com` | `senha123` | Carlos Silva | Painel do Professor, Chamada, Fechamento |
| **Professora** | `ana@prof.com` | `senha123` | Ana Souza | Painel da Professora, Chamada, WhatsApp |
| **Administrador** | `gestor@arenaadm.com` | `senha123` | Roberto Gestor | Painel Geral, Galeria, Relatórios, Arenas |

---

## 🧪 Executando os Testes Automatizados

O projeto conta com suíte de testes unitários e de integração utilizando `pytest`:

```bash
python -m pytest -v
```

Cobertura de testes:
- Validação estrita de domínios (`@prof.com`, `@arenaadm.com` e rejeições).
- Controle de acesso e proteção de rotas administrativas.
- Criação rápida de aulas, cálculos de presença e transição de status de fotos.
- Isolamento de dados entre professores.
- Integração WhatsApp e exportação de CSV.

---

## 📂 Estrutura de Pastas

```
├── app.py                      # Fábrica Flask, rotas, filtros PT-BR e erros
├── config.py                   # Configurações do banco SQLite e uploads
├── models.py                   # Modelos ORM (User, Arena, Student, ClassSession, Attendance, ClassPhoto)
├── auth.py                     # Lógica RBAC, decorators e validação de domínios
├── seed_data.py                # Dados iniciais realistas para teste imediato
├── requirements.txt            # Dependências Python
├── static/
│   ├── css/
│   │   ├── style.css           # Design system do tema Vôlei de Praia
│   │   └── components.css      # Cards de presença, botões 48px+, modais e galeria
│   ├── js/
│   │   ├── app.js              # Modais, alertas e lightbox
│   │   ├── quick_class.js      # Registro rápido e seleção 1-toque
│   │   └── whatsapp.js         # Integração WhatsApp (wa.me)
│   └── uploads/photos/         # Fotos das aulas
├── templates/                  # Templates Jinja2 em PT-BR (base, auth, professor, admin, errors)
└── tests/                      # Suíte de testes automatizados com pytest
```

---

## 🎨 Identidade Visual
Desenvolvido com foco na experiência do usuário em quadra de areia sob luz solar intensa:
- **Cores:** Azul Oceano (`#0369a1`), Areia Dourada (`#f59e0b`), Laranja Pôr do Sol (`#f97316`), Verde Presença (`#10b981`).
- **Mobile-first:** Barra de navegação inferior mobile, botões de toque com altura mínima de 48px e cards arredondados.
