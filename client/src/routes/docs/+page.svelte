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
<p>
    Filters are expecting an input of comma separated values E.g 'v1,v2,v3' resulting in a logical OR search.
</p>

<h3>Text Fields</h3>
<p>
    Text values are by default enclosed in wildcards, meaning input pattern(s) will be matched
    regardless of position in the text.
</p>

<h3>Numerical Fields</h3>
Numerical filter fields support the following operators:

<ul>
    <li>greater than '&gt;', greater equal '&gt;='</li>
    <li>lesser than '&lt;', lesser equal '&lt;='</li>
    <li>'min', 'max': Absolute min and max</li>
    <li>'min_v', 'max_v': For each version chain</li>
    <li>'min_a', 'max_a': Aggregate min and max with respect to other filters</li>
</ul>

<h3>Date fields</h3>
While in theory date fields are supporting the same operators as numerical fields,
they currently return somewhat inconsistent result.

This may be fixed in a future release.
