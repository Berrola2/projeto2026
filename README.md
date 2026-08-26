# 🏐 Sistema de Gestão de Aulas de Vôlei de Praia (SaaS Multi-Arenas)

Aplicação web moderna, ultra-responsiva e desenvolvida como uma plataforma SaaS para comercialização em múltiplas instituições e arenas de esportes de areia independentes com **Sincronização em Nuvem (Supabase)** em tempo real.

---

## ☁️ Sincronização em Nuvem em Tempo Real (Supabase)

Para que professores no celular e gestores no computador acessem **exatamente o mesmo banco de dados em tempo real**:

1. **Abra o SQL Editor do seu projeto Supabase** ([supabase.com](https://app.supabase.com)).
2. **Execute o script** [supabase_schema.sql](file:///d:/Trablaho_papis/supabase_schema.sql) localizado na raiz deste projeto (cria as tabelas `arenas`, `users`, `students`, `classes`, `app_state` e habilita o Realtime).
3. **No sistema (ou pelo modal `☁️ Conectar Supabase` no topo da tela):**
   - Insira o **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - Insira a **Anon / Public API Key** (chave pública do Supabase)
   - Clique em **"Conectar e Sincronizar"**.

> 🟢 **Pronto!** Uma vez configurado, qualquer aula, foto ou chamada feita no celular na quadra atualizará instantaneamente no computador do gestor!

---

## 🌟 Recursos do Sistema

### 1. ⚡ Geração Automática de E-mail / Login
Ao cadastrar um novo usuário ou professor, o login é gerado automaticamente em tempo real no padrão:
$$\text{(primeiro\_nome).(arena)@(funcao).com}$$

- **Exemplo (Professor):**
  - Nome: `Felipe Gabriel` | Arena: `Arena Ilha` | Função: `Professor`
  - **Login Gerado:** `felipe.ilha@prof.com`
- **Exemplo (Gestor):**
  - Nome: `Heitor Augusto` | Arena: `Arena Ilha` | Função: `Administrador/Gestor`
  - **Login Gerado:** `heitor.ilha@adm.com`

---

### 2. 🔑 Senha Inicial Automática & Encaminhamento via WhatsApp
Ao cadastrar um professor, a senha inicial é gerada no padrão:
$$\text{(primeiro\_nome).(5 números aleatórios)}$$
*(Exemplo: `felipe.53667`)*

- **Encaminhamento Direto:** O gestor pode copiar ou enviar os dados de login e senha diretamente no WhatsApp do professor com mensagem de boas-vindas já preenchida.

---

### 3. 🏅 Seleção de Modalidades Esportivas
- 🏐 **Vôlei de Praia**
- 🎾 **Beach Tennis**
- ⚽ **Futevôlei**
- 🏃‍♂️ **Funcional de Areia**
- ☀️ **Altinha**
- 🌟 **Múltiplas Modalidades**

---

### 4. 🗑️ Demissão / Desvinculação de Professores
Botão **"🗑️ Demitir"** no painel de professores para desvincular funcionários e revogar acessos com confirmação de segurança.

---

### 5. 🔒 Segurança & Isolamento Estrito por Arena (Multi-Instituição)
- **Gestor da Arena Ilha:** Visualiza **exclusivamente** dados, fotos e relatórios da **Arena Ilha**.
- **Gestor da Arena Maroka:** Visualiza **apenas** a **Arena Maroka**.
- **Zero Vazamento:** Dados de uma arena são inacessíveis para usuários de outras arenas.

---

## 🔑 Contas Pré-configuradas para Teste

### 🏖️ Arena Ilha
| Papel | E-mail / Login | Senha Inicial | Nome | Modalidade |
| :--- | :--- | :--- | :--- | :--- |
| **Gestor / Admin** | `heitor.ilha@adm.com` | `senha123` | Heitor Augusto | Gestão 🛡️ |
| **Professor** | `felipe.ilha@prof.com` | `felipe.74912` | Felipe Gabriel | Vôlei de Praia 🏐 |

### 🏖️ Arena Maroka (Isolada)
| Papel | E-mail / Login | Senha Inicial | Nome | Modalidade |
| :--- | :--- | :--- | :--- | :--- |
| **Gestor / Admin** | `marcos.maroka@adm.com` | `senha123` | Marcos Gestor | Gestão 🛡️ |
| **Professor** | `lucas.maroka@prof.com` | `lucas.83910` | Lucas Treinador | Futevôlei ⚽ |

---

## 🚀 Como Executar

### 1. Online (Vercel)
O projeto é 100% estático e otimizado para deploy instantâneo na Vercel com suporte completo a Supabase.

### 2. Localmente
```bash
python -m http.server 3000
# ou
npx serve .
```
Acesse `http://localhost:3000`.
