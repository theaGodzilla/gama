// Please excuse the mess, I need to do some tidying

var activeScreen = document.querySelector('.screen.is-active');
var menuScreen = document.querySelector('.screen.menu');
var gameScreen = document.querySelector('.screen.game');
var winScreen = document.querySelector('.screen.win');//游戏结束部分
var settingsScreen = document.querySelector('.screen.settings');//游戏设置部分
var scoreboardScreen = document.querySelector('.screen.scoreboard');//记分板
var scoreBoard = document.querySelector('.js-scoreboard');

var player = document.querySelector('.player');
var tongue = document.querySelector('.tongue');//舌头
var eyes = document.querySelectorAll('.eye');//眼睛
var pupils = document.querySelectorAll('.pupil');
var deadFly = document.querySelector('.tongue .fly');

var paths = document.querySelectorAll('.path');//苍蝇
var targets = document.querySelectorAll('.target');//苍蝇

var scoreEls = document.querySelectorAll('.js-score');//分数
var bestEls = document.querySelectorAll('.js-best');//最高分数
var timerEl = document.querySelector('.js-time');//制定时间
var highscoreEl = document.querySelector('.js-highscore');
var timerIntervalId;

//音频
var musicPlaying = false;//默认关闭
var musicButton = document.querySelector('.js-toggle-music')
var music = document.querySelector('#music');

var state = {};//状态
var hidden = [];//隐藏
var theme;//主题（白天和黑夜）
var scores = [];
var shooting = false;
var playing = false;//玩游戏的状态
var transitioning = false;
var lastPath = false;

var storage = window.localStorage;

//判断手指触屏事件还是点击事件
var clickOrTap = ((window.document.documentElement.ontouchstart!==null)?'click':'touchstart');

init();//初始化

function init() {
  prepPaths();
  loadStorage();
  renderBest();
  toggleScreen(menuScreen);
}
function prepPaths() {
  for (var i = 0; i < paths.length; i++) {
    //为所有的苍蝇添加id
    paths[i].setAttribute('data-id', i);
  }
}
function loadStorage() {
  theme = storage.getItem('theme');
  
  if (!theme) {
    theme = 'light';//白天
  }
  //获取分数
  scores = storage.getItem('scores');
  
  if (!scores) {
    scores = [];
  } else {
    scores = JSON.parse(scores);
  }
  
  toggleTheme(theme);
  renderScoreBoard();
}
//渲染分数
function renderScoreBoard() {
  var html = '';
  
  for (var i = 0; i < 10; i++) {
    html += "<li>";
    html += scores[i] || '-';
    html += "</li>";
  }
  
  scoreBoard.innerHTML = html;
  
}

//设置状态
function setState() {
  state = {
    time: 60, //设置游戏时间为30秒
    score: 0  
  }
}

//设置音乐开关
function toggleMusic() {
  musicPlaying = !musicPlaying;
  if (musicPlaying) {
    music.play();
    musicButton.textContent = "Stop Music";
  } else {
    music.pause();
    music.currentTime = 0;
    musicButton.textContent = "Play Music";
  }
  
}

function play() {
  playing = true;
  setState();//初始状态
  renderScore();//渲染分数
  toggleScreen(gameScreen);
  peep();
  peep();
  peep();
  peep();
  startTimer();
}

function win() {
  playing = false;
  var prevBest = scores[0] || 0;
  scores.push(state.score);
  console.log('游戏结束后的总分:',state.score);//得到游戏结束后的总分
  //对比新玩出来的分数，比历史最高的大就更新为最高分数
  scores.sort(function(a,b) {
    return b - a;
  });
  if (scores.length > 10) {
    scores.pop();
  }
  saveScores();
  var best = scores[0] || 0;
  if (state.score > prevBest) {
    best = state.score;
    highscoreEl.classList.remove('is-hidden');
  } else {
    highscoreEl.classList.add('is-hidden');
  }
  renderBest(best);
  renderScoreBoard();
  toggleScreen(winScreen);
}

function renderBest() {
  for (var i = 0; i < bestEls.length; i++) {
    bestEls[i].textContent = scores[0];
  }
}

//保存分数：把分数存起来
function saveScores() {
  storage.setItem('scores', JSON.stringify(scores));
}

function menu() {
  toggleScreen(menuScreen);
}

//切换到设置界面
function settings() {
  toggleScreen(settingsScreen);
}

//切换记分板
function scoreboard() {
  toggleScreen(scoreboardScreen);
}

function startTimer() {
  // 在开始计时前设置好时间
  timerEl.textContent = state.time;
  
  timerIntervalId = setInterval(function(e) {
    state.time -= 1;
    timerEl.textContent = state.time;
    
    if (state.time <= 0) {
      clearInterval(timerIntervalId);
      win();
    }
  }, 1000);
}

function score(value) {
  state.score += value || 1;
  
  renderScore();
}

//渲染分数
function renderScore() {
  for (var i = 0; i < scoreEls.length; i++) {
    scoreEls[i].textContent = state.score;
  }
  console.log('分数：',state.score);//得到分数
}

//切换游戏屏幕
function toggleScreen(screen) {
  if (activeScreen) {
    activeScreen.classList.remove('is-active');
  }
  
  screen.classList.add('is-active');
  activeScreen = screen;
}

//切换主题（白天和黑夜）
function toggleTheme(value) {
  document.body.classList.remove(theme);
  document.body.classList.add(value);
  theme = value;
  
  storage.setItem('theme', value);
}




// Game Logic 游戏逻辑
// Events 事件
window.onmousemove = eyesFollow;
window.document.addEventListener(clickOrTap, shoot);
for (var i = 0; i < targets.length; i++) {
  targets[i].addEventListener(clickOrTap, hit);
}

function shoot(e) {
  eyesFollow(e);
  // deadFly.classList.remove('is-active');
  
  player.classList.remove('is-active');
  tongue.style.height = 0 + "px";
  tongue.style.transform = "rotate(" + 0 + "deg)";

  var tongueX = tongue.getBoundingClientRect().left  + (tongue.offsetWidth);
  var tongueY = tongue.getBoundingClientRect().bottom;
  var touch = getTouch(e);
  var clickX = touch.x + (tongue.offsetWidth / 2);
  var clickY = touch.y;

  shooting = true;
  transitioning = true;

  var angle = getAngle(tongueX, tongueY, clickX, clickY);
  var height = getHeight(tongueX, tongueY, clickX, clickY);

  if (angle > 0 && angle < 180) {
    player.classList.add('is-shooting-down');
  } else {
    player.classList.remove('is-shooting-down');
  }

  player.classList.add('is-active');
  tongue.style.height = height + "px";
  tongue.style.transform = "rotate(" + (angle + 90)  + "deg)"; 
}

//舌头去吃苍蝇
function hit(e) {
  var path = this.parentNode;
  var id = path.getAttribute('data-id');
  
  if (!e.isTrusted || hidden.includes(id)) {
    return;
  }
  if (state.score % 2 == 0) {
    deadFly.classList.add('is-active2');
    deadFly.classList.remove('is-active');
  } else {
    deadFly.classList.add('is-active');
    deadFly.classList.remove('is-active2');
  }
  path.classList.remove('is-active');
  path.classList.add('is-hidden');
  hidden.push(id); 
  
  // Show dead fly on tongue 舌头上露出死苍蝇
  //deadFly.classList.add('is-active');
  // console.log('show dead fly');
  
  setTimeout(function() {
    var id = hidden.shift();
    paths[id].classList.remove('is-hidden');
  }, 1000);
  
  score();
}

//眼睛跟着触屏点击移动
function eyesFollow(e) {
  var touch = getTouch(e);
  moveEye({x: touch.x, y: touch.y}, eyes[0], pupils[0]);
  moveEye({x: touch.x, y: touch.y}, eyes[1], pupils[1]);
}

//眼睛跟着舌头移动
function moveEye(mouse, eye, pupil) {
  var left = 0;
  var top = 0;
  var eyeRadius = eye.offsetWidth / 2;
  var pupilRadius = pupil.offsetWidth / 2;

  var leftOffset = eye.getBoundingClientRect().left;
  var topOffset = eye.getBoundingClientRect().top;

  var center = [eye.getBoundingClientRect().left + eyeRadius, eye.getBoundingClientRect().top + eyeRadius];

  var dist = getDistance([mouse.x, mouse.y], center);

  if (dist <= eyeRadius) {
    left = mouse.x - leftOffset - eyeRadius;
    top = mouse.y - topOffset - eyeRadius;
  } else {
    var x = mouse.x - center[0];
    var y = mouse.y - center[1];
    var radians = Math.atan2(y, x);
    left = (Math.cos(radians) * (eyeRadius - pupilRadius));
    top = (Math.sin(radians) * (eyeRadius - pupilRadius));
  }
  
  // if (top > 0) {
  //   eye.classList.add('down');
  //   eye.classList.remove('up');
  //   console.log('down');
  // } else {
  //   eye.classList.add('up');
  //   eye.classList.remove('down');
  //   console.log('up');
  // }

  pupil.style.transform = "translate(" + left + "px, " + top + "px)";
}

//苍蝇随机出现
function getRandomPath(lanes) { 
  const idx = Math.floor(Math.random() * paths.length);
  const path = paths[idx];
  if (path === lastPath || paths[idx].classList.contains('is-hidden')) {
    // console.log('Ah nah thats the same one bud');
    return getRandomPath(paths);
  }
  lastPath = path;
  return path;
}

//苍蝇出现
function peep() {
  const time = getRandomTime(600, 1200);
  const path = getRandomPath(paths);
  path.classList.add('is-active');
  setTimeout(function() {
    path.classList.remove('is-active');
    if (playing) {
      peep();
    }
  }, time);
}

// Utility 实用程序
//获取随机时间
function getRandomTime(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

//获取距离
function getDistance(dot1, dot2) {
  var x1 = dot1[0],
      y1 = dot1[1],
      x2 = dot2[0],
      y2 = dot2[1];
    
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

//获取角度
function getAngle(cx, cy, ex, ey) {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = (Math.atan2(dy, dx)) * 180 / Math.PI;
  
  return theta;
}

function getHeight(x1, y1, x2, y2) {
  var a = x1 - x2;
  var b = y1 - y2;

  return Math.sqrt( a*a + b*b );
}

function getTouch(e) {
  if (e.touches) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  } else {
    return {
      x: e.clientX,
      y: e.clientY
    }
  }
}