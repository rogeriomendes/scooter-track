# ScooterTrack 📡

> [!AVISO]
**Projeto desenvolvido com Vibe-coded.** O ScooterTrack é construído por meio de um fluxo de trabalho rápido, assistido por IA e orientado por experimentação. Ele está em constante evolução: revise as alterações cuidadosamente e teste-as em seu próprio ambiente antes de confiar na correção automática para produção.

ScooterTrack é um aplicativo mobile em Expo e React Native para acompanhar o uso, manutenção e desempenho de scooters elétricas. O app centraliza registros de viagens, recargas, ciclos de bateria e itens de manutenção em um fluxo simples e visual.

## O que o projeto faz

- Gerencia múltiplas scooters em uma mesma instalação;
- Registra viagens com distância percorrida e observações;
- Registra recargas e calcula ciclos de uso entre cargas;
- Acompanha manutenção preventiva por quilometragem, meses ou data fixa;
- Exibe insights e gráficos de evolução de distância;
- Permite backup e restauração local dos dados.

## Stack principal

- Expo SDK 57 + React Native
- Expo Router para navegação
- TypeScript
- Drizzle ORM com SQLite local
- Zustand para estado global e persistência
- Reanimated, Gesture Handler e HeroUI Native para a interface

## Estrutura do projeto

- src/app: telas e rotas do app
- src/screens: módulos de Home, Recargas, Usos, Manutenção, Relatórios e Configurações
- src/components: componentes reutilizáveis e sheets de formulário
- src/db: schema do banco e cliente SQLite
- src/hooks: hooks para carregamento e cálculo de dados
- src/utils: funções utilitárias e estatísticas

## Como executar

1. Instale as dependências:
   ```bash
   pnpm install
   ```
2. Inicie o projeto:
   ```bash
   pnpm start
   ```
3. Escolha uma das opções:
   - Android: `pnpm android`
   - iOS: `pnpm ios`
   - Web: `pnpm web`

## Scripts disponíveis

- `pnpm start`: inicia o Expo Dev Server
- `pnpm android`: abre no Android
- `pnpm ios`: abre no iOS
- `pnpm web`: inicia a versão web
- `pnpm lint`: valida o projeto com Biome
- `pnpm lint:write`: corrige problemas automaticamente
- `pnpm format`: formata os arquivos

## Persistência de dados

Os dados são armazenados localmente em SQLite via Drizzle. Na tela de Configurações, é possível:

- exportar o banco para backup;
- restaurar um backup previamente exportado;
- apagar todos os dados da aplicação.

## Observações

Este projeto está em evolução e foi estruturado com foco em uso prático e rápida iteração. Recomenda-se revisar mudanças e testar em ambiente próprio antes de depender do app em cenários críticos.