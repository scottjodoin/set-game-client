const CARD_TYPES = {
    "shape": ["diamond","squiggly","oval"],
    "color": ["green","red","purple"],
    "shade":["solid","stripe","empty"],
    "count":["1","2","3"]
}
const audioSet = [
  new Audio('set1.mp3'),
  new Audio('set2.mp3'),
  new Audio('set3.mp3'),
  new Audio('set4.mp3'),
]
const splatSound = new Audio('splat.mp3')
const clickSound = new Audio('click.mp3');
const oopsSound = new Audio('oops.mp3')
let _cardID = 1
let _lastCard = null
let _locked = false;
let _hintCount = 0;

class Card{

    constructor(count, shape, color, shade, parentElement, clickEvent){
        this.id = _cardID++;

        this.count = count;
        this.shape = shape
        this.color = color
        this.shade = shade

        this.parentElement = parentElement
        this.element = document.createElement("div")
        this.element.card = this // this is a hack to make the card object available to the click event
        this.makeCardHtml()
        this.parentElement.appendChild(this.element)

        this.element.addEventListener("click",clickEvent);
    }

    makeCardHtml(){
        let e = this.element
        e.classList.add("card")
        e.setAttribute("count",this.count)
        e.setAttribute("shape",this.shape)
        e.setAttribute("color",this.color)
        e.setAttribute("shade",this.shade)
        e.innerHTML = `<span></span>`
    }

    setSelected(b){
        clickSound.play();
        if (b) this.element.classList.add("selected")
        else this.element.classList.remove("selected")
    }
    
    setHint(b){
        clickSound.play();
        if (b) this.element.classList.add("hint")
        else this.element.classList.remove("hint")
    }

    detach(){
        if (!this.parentElement) return
        let elem = this.parentElement.removeChild(this.element)
        this.parentElement = null
        return elem
    }

    append(elem){
        this.parentElement = elem
        elem.appendChild(this.element)
    }
    
    prepend(elem){
        this.parentElement = elem
        elem.prepend(this.element)
    }
}


// get all relevant elements
deck = document.getElementById("deck")
table = document.getElementById("table")
document.getElementById("add3").addEventListener("click",add3cards)
document.getElementById("hint").addEventListener("click",hint)
document.getElementById("reset").addEventListener("click",reset)

// create all cards
let _cards = []
let _hint = []
let _deck = []
let _table = []
let _selected = []

function reset(){
    
    while (_cards.length > 0)
        (_cards.pop()).detach()
    _deck = []
    _selected = []
    _table = []
    _hint = []
    _hintCount = 0

    for (let count of CARD_TYPES.count)
        for (let color of CARD_TYPES.color)
            for(let shade of CARD_TYPES.shade)
                for(let shape of CARD_TYPES.shape){
                    //card = new Card("3","squiggly","red",shade, deck, onClicked)
                    card = new Card(count,shape,color,shade, deck, onClicked)
                    _cards.push(card)
                    _deck.push(card)
                }
    
    repopulateTable(12)
}
// decide what to do when clicked

function inSelected(card){
    return !!_selected.find(c=>c.id==card.id)
}

function addToSelected(card){
    card.setSelected(true)
    _selected.push(card)
}

function removeFromSelected(card){
    card.setSelected(false)
    index = _selected.indexOf(card)
    _selected.splice(index,1)
}

function isASet(threeCards){
    return sameOrDifferent(threeCards.map(c=>c.count)) &&
        sameOrDifferent(threeCards.map(c=>c.shape)) &&
        sameOrDifferent(threeCards.map(c=>c.shade)) &&
        sameOrDifferent(threeCards.map(c=>c.color))
}

function sameOrDifferent(l){
    // the list should only have three elements
    if (l.length == 0 ) return true
    same = l[0] == l[1] && l[1] == l[2]
    different = !(l[0] == l[1] || l[0] == l[2] || l[1] == l[2])
    
    return same || different
}

function moveCardsToPlayer(id){
  
    playSetSound();

    playerDeck = document.getElementById(`player-${id}-deck`);
    
    while (_selected.length > 0){
        card = _selected.pop()
        card.setSelected(false)
        card.detach()
        card.prepend((!_lastCard) ? playerDeck : _lastCard.element )
        _table.splice(_table.indexOf(card),1)
        _lastCard = card;
    }
}

function playSetSound(){
    let audio = audioSet[Math.floor(Math.random() * audioSet.length)]
    audio.playbackRate = 0.8 + Math.random() * 0.4
    audio.play()
}

function resetSelected(){
    while (_selected.length > 0){
        _selected.pop().setSelected(false)
    }
}

function repopulateTable(count){
    clearHints();
    while (table.childElementCount < count && _deck.length > 0){
        random = Math.floor(Math.random() * _deck.length)
        card = _deck.splice(random,1)[0]
        card.detach()
        card.append(table)
        _table.push(card)
    }
}

function add3cards(){
    if (noSets())
        repopulateTable(table.childElementCount + 3)
    else{
        oopsSound.play()
        alert("There is a set in there somewhere!")
    }
}

function hint(){
    if (_hint.length == 0)
        _hint = set = getFirstSet()

    if (set.length == 0){
        alert("No sets! Adding three.")
        add3cards()
        return;
    }
    splatSound.play();
    _hint.pop().setHint(true)
    _hintCount++;
    updateStats();
}
function clearHints(){
    for (card of _cards)
        card.setHint(false)
    _hint = []
}

function updateStats
(){
    document.getElementById("hint-count").innerText = _hintCount;
}

function getFirstSet(){
    // this would be better as a yeild but this is quicker
    for (let a = 0; a < _table.length - 2; a++)
        for (let b = a + 1; b < _table.length - 1; b++)
            for (let c = b + 1; c < _table.length;  c++){
                let x = _table[a], y = _table[b], z = _table[c]
                if (isASet([x,y,z]))
                    return [x,y,z];
            }
    return []
}

function getAllSets(){
    sets = []
    if (_table.length < 3) return []
    for (let a = 0; a < _table.length - 2; a++)
        for (let b = a + 1; b < _table.length - 1; b++)
            for (let c = b + 1; c < _table.length;  c++){
                let x = _table[a], y = _table[b], z = _table[c]
                if (isASet([x,y,z]))
                    sets.push([x,y,z])
            }
    return sets;
}
function noSets(){
    return getAllSets().length == 0
}

function onClicked(e){
    if (_locked) return;
    card = e.target.card
    
    if (card.parentElement != table) return


    if (!inSelected(card)){
        addToSelected(card)
    }
    else return removeFromSelected(card)

    if (_selected.length >= 3)
        if (isASet(_selected)){
            _locked=true;
            setTimeout(()=>{
                moveCardsToPlayer(1)
                if (_deck.length == 0 && noSets()) alert("Yay! You win!");

                repopulateTable(12)
                _locked=false
            },50)
        } else
            resetSelected()
}

// Main
reset()