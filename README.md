# My Tab Export

### Exportação e backup individual em Excel

Implementar a funcionalidade **"Exportar minhas tabulações"**, disponível na tela de Tabulações Registradas.

Regras funcionais:

1. A exportação deve considerar exclusivamente os registros associados ao nome completo e setor informados na sessão atual.

2. Ao clicar em "Exportar minhas tabulações", consultar os registros correspondentes diretamente no banco de dados.

3. Gerar e baixar um arquivo Excel (.xlsx), com uma linha para cada tabulação cadastrada.

4. Exportar os nomes descritivos das classificações, nunca apenas os IDs técnicos.

5. Manter as colunas nesta ordem:

   - Canal

   - Origem

   - Tipo de Ocorrência

   - Assunto

   - Subassunto

   - Área de Interesse

   - Detalhe da Ocorrência

   - Grau de Criticidade

   - ID do Registro

   - Data e Hora da Inclusão

   - Nome do Usuário

   - Setor

6. Preservar todos os registros, inclusive tabulações duplicadas.

7. Gerar o nome do arquivo no padrão: Tabulacoes_CRM_NomeUsuario_Setor_Data.xlsx.

8. Aplicar cabeçalho, autofiltro, largura adequada das colunas e formatação de data/hora.

9. Exibir mensagem caso não existam registros para exportação.

10. Não limitar a exportação à página atual da tabela: incluir todos os registros pertencentes à identificação informada.

11. Disponibilizar o botão de exportação também na tela de Cadastro de Tabulações, para facilitar o backup ao finalizar os lançamentos.

Não implementar logs, histórico de operações, auditoria ou versionamento nesta V1.

A exportação será o mecanismo de backup individual dos usuários, enquanto o banco nativo do Lovable continuará armazenando a base centralizada.

Utilizar uma biblioteca leve de geração de arquivos XLSX, sem serviços externos e sem custos adicionais.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7baf5cf2-e985-4f6d-9bd9-a0686def24ec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
