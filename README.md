# 🏐 Sistema de Gestão de Aulas de Vôlei de Praia (SaaS Multi-Arenas)

Aplicação web moderna, ultra-responsiva e desenvolvida como uma plataforma SaaS para comercialização em múltiplas instituições e arenas de esportes de areia independentes.

---

## 🌟 Novidades da Versão

### 1. ⚡ Geração Automática de E-mail / Login
Ao cadastrar um novo usuário ou professor, o login é gerado automaticamente em tempo real no padrão:
$$\text{(primeiro\_nome).(arena)@(funcao).com}$$

- **Exemplo (Professor de Vôlei):**
  - Nome: `Felipe Gabriel`
  - Arena: `Arena Ilha`
  - Função: `Professor`
  - **Login Gerado:** `felipe.ilha@prof.com`
- **Exemplo (Gestor da Arena):**
  - Nome: `Heitor Augusto`
  - Arena: `Arena Ilha`
  - Função: `Administrador/Gestor`
  - **Login Gerado:** `heitor.ilha@adm.com`

---

### 2. 🔑 Geração de Senha Inicial & Encaminhamento via WhatsApp
Ao cadastrar um professor, o gestor recebe automaticamente a senha inicial no padrão:
$$\text{(primeiro\_nome).(5 números aleatórios)}$$

- **Exemplo:** `felipe.53667`
- **Modal de Encaminhamento:** O gestor pode copiar os dados de acesso em 1 clique ou encaminhar diretamente para o WhatsApp do professor com mensagem formatada de boas-vindas.

---

### 3. 🏅 Seleção de Modalidades Esportivas
O gestor pode definir a modalidade de atuação de cada professor:
- 🏐 **Vôlei de Praia**
- 🎾 **Beach Tennis**
- ⚽ **Futevôlei**
- 🏃‍♂️ **Funcional de Areia**
- ☀️ **Altinha**
- 🌟 **Múltiplas Modalidades**

---

### 4. 🗑️ Demissão / Desvinculação de Professores
Caso um funcionário seja desligado, o gestor conta com o botão **"🗑️ Demitir"** no painel de professores para remover o acesso daquele professor à arena.

---

### 5. 🔒 Segurança & Isolamento Estrito por Arena (Multi-Instituição)
- **Gestor da Arena Ilha:** Visualiza **exclusivamente** as aulas, fotos da galeria, relatórios, alunos e professores cadastrados na **Arena Ilha**.
- **Gestor da Arena Maroka:** Visualiza **apenas** o que os professores da **Arena Maroka** postarem.
- **Zero Vazamento de Dados:** Usuários de uma arena não têm acesso a fotos, relatórios ou informações de outra arena.

---

## 🔑 Contas Pré-configuradas para Demonstração

### 🏖️ Arena Ilha
| Papel | E-mail / Login | Senha | Nome | Modalidade |
| :--- | :--- | :--- | :--- | :--- |
| **Gestor / Admin** | `heitor.ilha@adm.com` | `senha123` | Heitor Augusto | Gestão |
| **Professor** | `felipe.ilha@prof.com` | `felipe.74912` | Felipe Gabriel | Vôlei de Praia 🏐 |

### 🏖️ Arena Maroka (Isolada)
| Papel | E-mail / Login | Senha | Nome | Modalidade |
| :--- | :--- | :--- | :--- | :--- |
| **Gestor / Admin** | `marcos.maroka@adm.com` | `senha123` | Marcos Gestor | Gestão |
| **Professor** | `lucas.maroka@prof.com` | `lucas.83910` | Lucas Treinador | Futevôlei ⚽ |

---

## 📱 Recursos Principais

1. **⚡ Registro Rápido de Aula (&lt; 1 Minuto no Celular na Quadra):**
   - Chamada com 1-toque nos cards dos alunos (`🟢 Presente` / `⚪ Ausente`).
   - Botões "Todos Presentes" e "Todos Ausentes" com contadores dinâmicos.
   - Captura de foto direto da câmera do celular (`capture="environment"`).
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
