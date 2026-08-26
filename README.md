# 🏐 Sistema de Gestão de Aulas de Vôlei de Praia (SaaS Multi-Arenas)

Aplicação web moderna, ultra-responsiva e desenvolvida como uma plataforma SaaS para comercialização em múltiplas instituições e arenas de vôlei de praia independentes.

---

## 🌟 Novidades: Geração Automática de E-mail & Isolamento Multitenant

### 1. ⚡ Geração Automática de E-mail / Login
Ao cadastrar um novo usuário ou professor, o e-mail/login é gerado automaticamente e em tempo real no padrão:
$$\text{(primeiro\_nome).(arena)@(funcao).com}$$

- **Exemplo 1 (Professor):**
  - Nome: `Felipe Gabriel`
  - Arena: `Arena Ilha`
  - Função: `Professor`
  - **Login Gerado:** `felipe.ilha@prof.com`
- **Exemplo 2 (Gestor / Administrador):**
  - Nome: `Heitor Augusto`
  - Arena: `Arena Ilha`
  - Função: `Administrador/Gestor`
  - **Login Gerado:** `heitor.ilha@adm.com`

---

### 2. 🔒 Segurança & Isolamento Estrito por Arena (Multi-Instituição)
O sistema conta com regras de segurança para atender a venda para múltiplas instituições:
- **Gestor da Arena Ilha:** Visualiza **exclusivamente** as aulas, fotos da galeria, relatórios, alunos e professores cadastrados na **Arena Ilha**.
- **Gestor da Arena Maroka:** Visualiza **apenas** o que os professores da **Arena Maroka** postarem.
- **Zero Vazamento de Dados:** Usuários de uma arena não têm acesso a fotos, relatórios ou informações de outra arena.

---

## 🔑 Contas Pré-configuradas para Demonstração

### 🏖️ Arena Ilha
| Papel | E-mail / Login | Senha | Nome |
| :--- | :--- | :--- | :--- |
| **Gestor / Admin** | `heitor.ilha@adm.com` | `senha123` | Heitor Augusto |
| **Professor** | `felipe.ilha@prof.com` | `senha123` | Felipe Gabriel |

### 🏖️ Arena Maroka (Isolada)
| Papel | E-mail / Login | Senha | Nome |
| :--- | :--- | :--- | :--- |
| **Gestor / Admin** | `marcos.maroka@adm.com` | `senha123` | Marcos Gestor |
| **Professor** | `lucas.maroka@prof.com` | `senha123` | Lucas Treinador |

### 🏖️ Outras Arenas
| Papel | E-mail / Login | Senha | Nome |
| :--- | :--- | :--- | :--- |
| **Professor (Ipanema)** | `carlos.ipanema@prof.com` | `senha123` | Carlos Silva |
| **Professora (Copacabana)** | `ana.copacabana@prof.com` | `senha123` | Ana Souza |

---

## 📱 Recursos Principais

1. **⚡ Registro Rápido de Aula (&lt; 1 Minuto no Celular na Quadra):**
   - Chamada com 1-toque nos cards dos alunos (`🟢 Presente` / `⚪ Ausente`).
   - Botões "Todos Presentes" e "Todos Ausentes" com contadores dinâmicos.
   - Captura de foto direto da câmera do celular.
2. **📸 Modais de Foto & Disparo no WhatsApp:**
   - Aviso de foto pendente `🟡 PENDENTE`.
   - Geração automática de link `https://wa.me/?text=...` com mensagem personalizada da aula.
   - Atualização para status `🔵 PREPARADO PARA ENVIO`.
3. **📸 Galeria Central & Lightbox:**
   - Feed fotográfico filtrado por Data, Professor e Turma (restrito à arena do gestor).
4. **📊 Relatórios & Exportação CSV:**
   - Métricas consolidadas por Professor e Arena com download formatado para Excel em português.

---

## 🚀 Como Executar

### 1. Online (Vercel)
O projeto é 100% estático e otimizado para deploy instantâneo na Vercel com zero erros de runtime ou serverless.

### 2. Localmente
```bash
python -m http.server 3000
# ou
npx serve .
```
Acesse `http://localhost:3000`.
