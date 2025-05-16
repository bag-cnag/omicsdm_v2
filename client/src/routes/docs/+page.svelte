<script lang="ts">
    import { Tabs, TabItem } from 'flowbite-svelte';
</script>

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

<Tabs class="relative">
    <TabItem open title="Tables">
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
    </TabItem>
    <TabItem title="Direct Creation">
        <h2>Direct Creation</h2>

        <p>
            If you have enough privileges to create resources, there will be a "Direct Creation" button
            next to the relevant form.
        </p><br/>

        <p>
            You have the possibility to create those resources from TSV or JSON. For this, you may download
            the associated template, fill it and click 'Verify'.
        </p><br/>

        <p>
            A staging view will let you review the data you want to insert, with some client side validation,
            highliting potential mistakes.
            This validation is not covering all the cases, for example key uniqueness on a resource (e.g. short_names).
        </p><br/>

        <p>
            In that case, upon submitting a server error will be returned and print out informations.
        </p>
    </TabItem>
</Tabs>
