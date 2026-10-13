cask "shareclip" do
  arch arm: "arm64", intel: "x64"

  version "4.5.15"
  sha256 arm:   "1880c2b7db7fe0d5dbef3f49412c4b9ea0284d9fec9a7fa77377dcfad310bfed",
         intel: "1934bbd55a3fcf8a3b0c7fc72da8eb12d4520df5a6538db82d011fec954e223c"

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
