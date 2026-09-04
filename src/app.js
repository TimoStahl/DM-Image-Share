const channel = new BroadcastChannel("dm_screen_share_pro_grid");
let isBlackout = false;

function initRole(role) {
  document.getElementById("setup").style.display = "none";
  if (role === "dm") {
    document.title = "Sender - DM Image Share";
    document.getElementById("dm-view").style.display = "block";
    setupDM();
  } else {
    document.title = "Receiver - DM Image Share";
    setupPlayer();
    renderPlayerGrid([]);
  }
}
