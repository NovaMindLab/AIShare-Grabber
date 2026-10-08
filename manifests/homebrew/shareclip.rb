cask "shareclip" do
  arch arm: "arm64", intel: "x64"

  version "4.5.8"
  sha256 arm:   "0e262192d3246809a5eeaaea7fcaee4f99f57314b255eb96a5b2f606f638237c",
         intel: "fcd71197b058ada019b378bb18d16b086020c61213307e4cfed634879c57ceaf"

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
