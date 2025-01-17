<style>
    h2 {
        font-weight: bold;
    }
    h3 {
        margin: .5em;
        padding: .5em;
    }
    ul {
        margin: 1em;
    }
    ul li::before {
        content: '- ';
    }
</style>

<h1>How to Use</h1>

<h2>Table filters</h2>
<h3>Text Fields</h3>
Text fields are by default enclosed in wildcards, meaning input pattern will be matched regardless
of its position in the text.

<h3>Numerical Fields</h3>
Numerical filter fields support the following operators:

<ul>
    <li>greater than '&gt;', greater equal '&gt;='</li>
    <li>lesser than '&lt;', lesser equal '&lt;='</li>
    <li>'min', 'max'</li>
</ul>

<h3>Version</h3>
On top of other numerical field operators, 'version' columns are supporting

<ul>
    <li>'min_v', 'max_v'</li>
</ul>

Same as min and max but applied for each chain of resources instead of the whole table.
