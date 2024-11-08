#!/bin/bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "mediaoup version required. e.g: \"$0 3.12.16\""
    exit 1
fi

function validate_download_url() {
    if ! wget -S --spider "$1" 2>&1 | grep 'HTTP/1.1 200 OK'; then
        return 1
    else
        return 0
    fi
}

SCRIPT_PATH=$(realpath "$0")
PARENT_DIR="$(dirname "$SCRIPT_PATH")"

# Download the mediasoup-worker binary with the correct version
mkdir -p "$PARENT_DIR/server/bin" || exit 1
MEDIASOUP_VERSION="$1"

# Download mediasoup-worker binary if not found for the specified version
if [ ! -f "$PARENT_DIR/server/bin/mediasoup-worker-$MEDIASOUP_VERSION" ]; then

    if ! command -v "awk" &>/dev/null; then
        echo "Command 'awk' is necessary"
        exit 1
    fi

    LINUX_KERNEL_VERSION=$(awk -F . '{print $1}' <<<"$(uname -r)")
    DOWNLOAD_URL="https://github.com/versatica/mediasoup/releases/download/$MEDIASOUP_VERSION/mediasoup-worker-$MEDIASOUP_VERSION-linux-x64-kernel$LINUX_KERNEL_VERSION.tgz"
    if ! validate_download_url "$DOWNLOAD_URL"; then
        DOWNLOAD_URL="https://github.com/versatica/mediasoup/releases/download/$MEDIASOUP_VERSION/mediasoup-worker-$MEDIASOUP_VERSION-linux-x64.tgz"
    fi
    if ! validate_download_url "$DOWNLOAD_URL"; then
        echo "mediasoup-worker binary not found at $DOWNLOAD_URL"
        exit 1
    fi
    wget "$DOWNLOAD_URL" -P "$PARENT_DIR/server/bin" || exit 1
    pushd "$PARENT_DIR/server/bin" || exit 1
    for f in mediasoup-worker*.tgz; do
        tar zxvf "$f" || exit 1
        rm mediasoup-worker*.tgz || exit 1
    done
    mv mediasoup-worker mediasoup-worker-"$MEDIASOUP_VERSION"
    chmod +x mediasoup-worker-"$MEDIASOUP_VERSION"
    popd
fi

# Reinstall "mediasoup" npm package if MEDIASOUP_VERSION is different from the one in package.json
pushd "$PARENT_DIR/server" || exit 1
if [ "$(grep -oP '(?<="mediasoup": ")[^"]*' package.json)" != "$MEDIASOUP_VERSION" ]; then
    rm -rf node_modules/mediasoup || exit 1
    npm i mediasoup@"$MEDIASOUP_VERSION" || exit 1
fi
npm i || exit 1
popd || exit 1

# Export all environment variables from .env file
export $(grep -v '^#' "$PARENT_DIR"/server/.env | xargs)

# Export necessary environment variables for running the server as a binary executable
export MEDIASOUP_WORKER_BIN="$PARENT_DIR/server/bin/mediasoup-worker-$MEDIASOUP_VERSION"
export CERT_PEM="../cert.pem"
export KEY_PEM="../key.pem"

# Build the server binary
cd "$PARENT_DIR"/server || exit 1
npm run build:binary || exit 1

# Check announced IP
EXTERNAL_IP=$(dig +short myip.opendns.com @resolver1.opendns.com)
if [ "$EXTERNAL_IP" != "$MEDIASOUP_ANNOUNCED_IP" ]; then
    echo
    echo "  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo
    echo "  WARNING: The announced IP address is different than the detected external IP address"
    echo "  [External IP: $EXTERNAL_IP, Announced IP: $MEDIASOUP_ANNOUNCED_IP]"
    echo
    echo "  If this is a production deployment, update .env file $PARENT_DIR/server/.env with:"
    echo "  MEDIASOUP_ANNOUNCED_IP=$EXTERNAL_IP"
    echo
    echo "  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo
fi

# Run the server binary
cd "$PARENT_DIR"/server/bin || exit 1
./mediasoup-server
