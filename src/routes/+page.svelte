<script lang="ts"> 
    import Menu from '$lib/components/Menu.svelte';
    import Game from '$lib/components/Game.svelte';
    let start = false;
</script>
{#if start === false}
     <Menu onStart={() => start = true} onHowToPlay={() => console.log('How to Play')} />

{/if}

{#if start}
    <Game />
{/if}