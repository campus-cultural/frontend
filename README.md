# Campus Cultural UTFPR - Frontend

Aplicativo mobile em Expo/React Native para autenticação, perfil e cadastro de eventos culturais da UTFPR.

## Stack

- Expo SDK 54
- React Native 0.81
- Expo Router
- TypeScript
- EAS Build para builds Android/iOS

## Requisitos

- Git
- Node.js LTS
- npm
- Android Studio, para emulador/build Android local
- Xcode, apenas para iOS em macOS
- Backend do projeto rodando em `http://127.0.0.1:8000` ou URL configurada em `.env`

Referências oficiais:

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Expo Android APK Builds](https://docs.expo.dev/build-reference/apk/)
- [Expo Production Builds](https://docs.expo.dev/deploy/build-project/)
- [React Native Android Environment](https://reactnative.dev/docs/set-up-your-environment)

## Primeira Instalação

```bash
git clone https://github.com/campus-cultural/frontend.git
cd frontend
git checkout develop
npm install
cp .env.example .env
```

Configure a API em `.env`:

```bash
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

No Android Emulator, se o backend estiver na sua máquina:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

Variáveis `EXPO_PUBLIC_*` entram no bundle do app. Não coloque tokens privados, senhas, chaves de assinatura ou segredos no frontend.

## Rodar em Desenvolvimento

```bash
npm start
```

Atalhos úteis no terminal do Expo:

- `a`: abre Android Emulator
- `i`: abre iOS Simulator no macOS
- `w`: abre web

Também há scripts diretos:

```bash
npm run android
npm run ios
npm run web
npm run start:clear
```

Esses scripts abrem o app em modo de desenvolvimento. Para compilar um binário nativo localmente, use os scripts `run:*` ou `build:*`.

## Android Studio - Windows

1. Instale o Android Studio pelo site oficial: https://developer.android.com/studio
2. Abra o Android Studio e instale:
   - Android SDK Platform
   - Android SDK Platform-Tools
   - Android Emulator
   - Android SDK Build-Tools
3. Abra `Settings > Languages & Frameworks > Android SDK`.
4. Confirme o caminho do SDK. Normalmente:

```text
C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk
```

5. Configure as variáveis de ambiente do Windows:

```text
ANDROID_HOME=C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk
```

Adicione ao `Path`:

```text
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\cmdline-tools\latest\bin
```

6. Feche e abra o terminal novamente.
7. Teste:

```bash
adb version
emulator -list-avds
```

## Android Studio - macOS

1. Instale o Android Studio pelo site oficial: https://developer.android.com/studio
2. Abra `Settings > Languages & Frameworks > Android SDK`.
3. Instale SDK Platform, Platform-Tools, Emulator e Build-Tools.
4. Configure no `~/.zshrc`:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/emulator"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
```

5. Recarregue o shell:

```bash
source ~/.zshrc
adb version
emulator -list-avds
```

## Android Studio - Linux

1. Instale o Android Studio pelo site oficial: https://developer.android.com/studio
2. Abra `Settings > Languages & Frameworks > Android SDK`.
3. Instale SDK Platform, Platform-Tools, Emulator e Build-Tools.
4. Configure no `~/.bashrc` ou `~/.zshrc`:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/emulator"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
```

5. Recarregue o shell:

```bash
source ~/.bashrc
adb version
emulator -list-avds
```

Em algumas distribuições Linux, pode ser necessário configurar KVM para acelerar o emulador.

## Criar Emulador Android

1. Android Studio > `Device Manager`.
2. `Create Virtual Device`.
3. Escolha um Pixel recente.
4. Baixe uma imagem Android estável.
5. Inicie o emulador.
6. Rode:

```bash
npm run android
```

## Checks Antes de Enviar PR

```bash
npm run typecheck
npm run lint
npm run export:web
```

Ou:

```bash
npm run check
```

## Build Web

```bash
npm run export:web
```

O resultado sai em `dist/`.

## Identidade Nativa do App

O `ios.bundleIdentifier` e o `android.package`, em `app.json`, são os identificadores nativos únicos do aplicativo. Eles seguem formato de domínio reverso e devem representar o projeto, não a máquina ou pessoa que fez o build.

Neste projeto:

```text
br.edu.utfpr.campuscultural
```

No iOS, esse valor precisa existir/ser registrado na conta Apple Developer apenas para assinatura, distribuição e App Store. Para simulador local, ele serve como identificador do app instalado. No Android, `android.package` vira o application id usado pelo sistema, pelo emulador e pela Play Store.

Permissões nativas também saem do `app.json`. Se alguma biblioteca adicionar uma permissão que o app não usa, bloqueie em `android.blockedPermissions` para evitar permissões desnecessárias no APK/AAB.

## Build Local Android

Para compilar e instalar uma build de debug no emulador/dispositivo:

```bash
npm run run:android
```

O Expo CLI gera `android/` automaticamente na primeira execução se a pasta ainda não existir.

Para regenerar o projeto nativo do zero quando `app.json` mudar:

```bash
npm run prebuild:clean -- --platform android
```

Para gerar APK interno com EAS local:

```bash
npm run build:android:preview:local
```

O EAS local exige Android SDK/NDK configurado na máquina. No Windows, a Expo recomenda usar WSL para EAS local; para desenvolvimento diário no Windows, prefira `npm run run:android` ou abra o projeto gerado no Android Studio.

Evite commitar as pastas nativas geradas (`android/`, `ios/`) sem alinhamento com o time.

## Estrutura do Projeto

```text
app/                  rotas do Expo Router, finas e sem regra de negócio
src/lib/              integrações, configuração e serviços de baixo nível
src/view/screens/     telas completas por domínio
components/           componentes herdados do template/base
assets/               imagens, fontes e arquivos estáticos
docs/                 guias internos do projeto
```

O arquivo `assets/logoUTF.png` é usado na tela de login. Substitua esse arquivo pelo logo oficial mantendo o mesmo nome.

## Fluxo de Contribuição

1. Atualize a branch base:

```bash
git checkout develop
git pull
```

2. Crie uma branch de trabalho com nome descritivo, conforme combinado pelo time.

3. Implemente a mudança seguindo `docs/CODE_STYLE.md`.
4. Rode os checks:

```bash
npm run check
npm run export:web
```

5. Faça commit com Conventional Commits e gitmoji:

```bash
git commit -m "feat: ✨ adiciona tela de exemplo"
```

6. Publique:

```bash
git push -u origin HEAD
```

7. Abra PR para `develop`.

## Segurança

- Não commitar `.env`, keystores, certificados ou tokens.
- Não colocar segredos em `EXPO_PUBLIC_*`; eles ficam visíveis no bundle.
- Token de sessão fica no `expo-secure-store` em mobile.
- No web, o fallback usa armazenamento do navegador e deve ser tratado como menos seguro.
- Builds de produção usam bundle minificado; `metro.config.js` remove `console.*` e aplica mangling/minificação.
- Regras sensíveis devem ficar no backend. O frontend só valida para UX.
