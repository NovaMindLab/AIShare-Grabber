cask "shareclip" do
  arch arm: "arm64", intel: "x64"

  version "4.5.10"
  sha256 arm:   "168b808cb7afed1f7cfd6ad287c54a6f1316a4b788ae2501aee954bb611f666c",
         intel: "9b49af4f2c1a1cf7360e1ba7b2f1b4e5f68fbcb1fb5c070cfaef041ec3c9ebe8"

  url "https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v#{version}/ShareCLIP-Mac-#{version}-#{arch}.dmg",
      verified: "github.com/NovaMindLab/AIShare-Grabber/"
  name "ShareCLIP"
  desc "Local-first P2P file transfer and on-device AI photo gallery"
  homepage "https://novamindlab.github.io/AIShare-Grabber/"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: ">= :catalina"

  app "ShareCLIP.app"

  zap trash: [
    "~/Library/Application Support/ShareCLIP",
    "~/Library/Preferences/com.shareclip.album.sync.plist",
    "~/Library/Saved Application State/com.shareclip.album.sync.savedState",
    "~/Library/Logs/ShareCLIP",
  ]
end
