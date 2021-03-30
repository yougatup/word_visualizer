import logo from './logo.svg';
import {useState, useEffect} from 'react'
import { readString } from 'react-papaparse'
import './App.css';


const defaultText = "Most children readily engage in many forms of creative expression, including play, pretending, and art projects such as painting and drawing. But as we grow older, many adults disengage from creative expression, with explanations such as “I cannot draw”, “I am not creative”, or “I do not know what to draw”. Various factors affect creativity and may explain this different approach between children and adults. Amabile differentiates between self-motivated (pleasure) versus extrinsic (reward) motivations for the respective groups, and states that extrinsic motivations are often associated with anxieties that inhibit creativity. Time constraints in our busy daily lives may also adversely affect creativity. Yet, despite all these obstacles, the benefits of (adult) creative expression are well documented. Painting is a good example of this rift between childhood and adult creativity. Finger painting is accessible even to a young toddler, while the “proper” mastery of brushes and paints takes years of training. In this paper, we design a creativity support tool (CST) for digital painting for the vast majority of adults who rarely or never engage in fine arts. Artistic challenges and rewards are different for novices and professionals. The average novice does not seek the approval of an art critic or a paying customer, but rather seeks the enjoyment of the task and the approval of his (novice) peers. Novices face various challenges: They are unfamiliar with tools and techniques, they are intimidated by the blank page, they are unwilling to invest a lot of time, and they are easily frustrated or discouraged. We therefore seek to create a safe playground for novices to experiment with painting, where safe means “controlled to guarantee a minimum degree of quality”. Controlling the user’s environment necessarily limits their creative choices, so a balance must be struck between the two. The type of creativity we enable in this paper is that of a ‘cooking challenge’."

function App() {
  const [myText, setMyText] = useState(defaultText);
  const [myData, setMyData] = useState({})
  const [myConcretenessResult, setMyConcretenessResult] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/concreteness_rating.csv')
      .then(response => response.text())
      .then(data => {
        const results = readString(data)

        var myDict = {};

        for (var i = 1; i < results.data.length; i++) {
          var row = results.data[i];

          myDict[row[0]] = parseFloat(row[2])
        }

        setMyData(myDict);
      })
  }, [])

  function getResult() {
    if(Object.keys(myData).length > 0) {
      var splitted = myText.split(' ');
      var result = [];

      for(var i=0;i<splitted.length;i++) {
        var refined = splitted[i].replace(/\W/g, '').toLowerCase();

        result.push( {
          originalWord: splitted[i],
          word: refined,
          score: (refined in myData ? myData[refined] : 0)
        })
      }

      return <div>
            {
              result.map( (elem) => {
                var opacity = Math.pow(2, elem.score) / 32;
                var divStyle = "'background-color: rgba(255, 0, 0, " + opacity + ")'";

                return <span className='wordSpan' style={{backgroundColor: "rgba(0, 255, 0, " + opacity + ")"}} > {elem.originalWord} </span>
              })
            }
          </div>
    }
  }

  function textAreaChanged() {
    var text = document.getElementById("myTextArea").value;

    const requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    fetch('http://server.hyungyu.com:3333/?text=' + text, requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log(data);

        getQuery(data);
      });
/*
    var text = document.getElementById("myTextArea").value;

    if(text == '') setMyText(defaultText);
    else setMyText(text)
    */
  }
  
  function traverse(graph, start, mask, root) {
    mask[start] = true;

    for(var i=0;i<graph[start].length;i++) {
      var node2 = graph[start][i];

      if(!mask[node2] && node2 < root) {
        traverse(graph, node2, mask, root);
      }
    }

/*
    for(var i=0;i<graph[start].length;i++) {
      if(i < start) 
        mask[graph[start][i]] = true;
    }
    */
  }

  function getQuery(result) {
    var retValue = [];
    var graph = [];

    for(var i=0;i<result.mySyntax.length;i++) {
      graph.push([]);
    }

    for(var i=0;i<result.mySyntax.length;i++) {
      graph[parseInt(result.mySyntax[i].parent)].push(i);
    }

    for(var i=0;i<result.mySyntax.length;i++) {
      var elem = result.mySyntax[i];
      var Mask = []

      for(var j=0;j<result.mySyntax.length;j++) Mask.push(false);

      elem.score = (elem.text.toLowerCase() in myData ? myData[elem.text.toLowerCase()] : 0);

      if(elem.score >= 4) {
        traverse(graph, i, Mask, i);

        var resText = '';

        for(var j=0;j<Mask.length;j++) {
          if(Mask[j]) 
           resText = resText + (resText == '' ? '' : ' ') + result.mySyntax[j].text
        }

        retValue.push({
          query: resText,
          concretenessWord: elem.text.toLowerCase(),
          score: elem.score
        });
      }
    }

    setMyConcretenessResult(retValue);

    return;
  }

  function getTable() {
    return <table>
      <tr>
        <th> Query string </th>
        <th> Word </th>
        <th> Concreteness score </th>
      </tr>

      {
        myConcretenessResult.map((elem) => (
          <tr>
            <td> {elem.query} </td>
            <td> {elem.concretenessWord} </td>
            <td> {elem.score} </td>
          </tr>
        ))
      }

    </table>
  }

  return (
    <div className="App">
      <div className='leftPlane'>
        <textarea id='myTextArea'> </textarea>
        <button id='submitBtn' onClick={textAreaChanged}> Submit </button>
      </div>
      <div className='rightPlane'>
        { getResult() }
      </div>
      <div className='concretenessPlane'>
        { getTable() }
      </div>
    </div>
  );
}

export default App;
