<script lang="ts">
	import '../app.css';
	let { children } = $props();

	import { lastpage } from '../auth';
	import { beforeNavigate } from '$app/navigation';
    import { isAuthenticated, user } from "auth";
	import { page } from '$app/stores'
    import Login from '../lib/Login.svelte'

	beforeNavigate((nav) => {
		let page = ""
		if(!nav.from || !nav.from.url){
			page = "/"
		} else {
			page = nav.from!.url.toString()
		}
		lastpage.set(page);
	});

	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Avatar, DropdownHeader, DropdownDivider, DropdownItem, Dropdown } from 'flowbite-svelte';

	let activeUrl = $state<string>();
	$effect(() => { activeUrl = $page.url.pathname; })
</script>

<!-- <style>
	.active-link {
		@apply: 
	}

	.other-link {

	}
</style> -->

<!-- <div class="flex">
	<Nav />

	<div class="card right flex-auto">
		{#if !$isAuthenticated}
		<Login />
		{:else}
		<span>Welcome {$user}</span><br/>
		<span>
			<a href="/logout">Log out</a>
		</span>
		{/if}
	</div>
</div> -->

<style>
	#logout::after {
		text-align: center;
	    background: theme('colors.primary.600');
		content:url('data:image/svg+xml,<svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"/></svg>');
		-webkit-mask:url("data:image/svg+xml,<svg class='w-6 h-6' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'><path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2'/></svg>") center/contain no-repeat;
				mask:url("data:image/svg+xml,<svg class='w-6 h-6' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'><path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2'/></svg>") center/contain no-repeat;
	}
</style>


<div class="w-full">
	<Navbar rounded fluid={true} color="primary">
		<NavBrand href="/">
		  <img src="/3TR.ico" class="me-3 h-6 sm:h-9" alt="3TR Logo" />
		  <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">3TR</span>
		</NavBrand>

		{#if !$isAuthenticated}
			<div class="order-2 md:order-4">
				<Login />
			</div>
		{:else}
			<div class="flex items-center md:order-2">
				<Avatar id="avatar-menu">{$user.charAt(0)}</Avatar>
				<NavHamburger menuClass="w-full md:flex md:w-auto md:order-1" />
			</div>
			<Dropdown placement="bottom" triggeredBy="#avatar-menu">
				<DropdownHeader>
				<span class="block text-sm">{$user}</span>
				<!-- TODO: user first name, last name, email -->
				<!-- <span class="block truncate text-sm font-medium">name@flowbite.com</span> -->
				</DropdownHeader>
				<!-- <DropdownDivider /> -->
				<DropdownItem><a href="/logout" id="logout">Sign out</a></DropdownItem>
			</Dropdown>
		{/if}

		<NavUl {activeUrl}>
		  <NavLi href="/about">About</NavLi>
		  <NavLi href="/docs">User Manual</NavLi>
		</NavUl>
	  </Navbar>
	<div class="container mx-auto">
		{@render children()}
	</div>
</div>
